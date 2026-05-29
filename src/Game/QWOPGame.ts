import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3, Quaternion } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { RegisterJoinedPhysicsEngineComponent } from "@babylonjs/core/Physics/joinedPhysicsEngineComponent";
import HavokPhysics from "@babylonjs/havok";
import { KeyboardEventTypes, KeyboardInfo } from "@babylonjs/core/Events/keyboardEvents";
import { Observer } from "@babylonjs/core/Misc/observable";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { CreateSoundAsync, AbstractSound } from "@babylonjs/core/AudioV2";

import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Grid } from "@babylonjs/gui/2D/controls/grid";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Slider } from "@babylonjs/gui/2D/controls/sliders/slider";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";

type LegData = {
    localAnchor: Vector3;
    foot: Mesh;
    footAgg: PhysicsAggregate;
    springMesh: Mesh;
};

export class QWOPGame {
    private scene: Scene;
    private plugin!: HavokPlugin;

    // Estado do jogo
    private gameState: string = "PLAYING";
    private bestDist: number = 0;
    private bestVel: number = 0;
    private lastDist: number = 0;
    private nextMilestone: number = 10;
    private keysCount: number = 0;
    private totalKeysFound: number = 0;
    private nextKeyZ: number = 10;

    // Parâmetros físicos (mutáveis pelos sliders)
    private k: number = 60;
    private damping: number = 4.0;
    private sMass: number = 1.5;
    private tableMass: number = 12;

    // Constantes da pista / mesa / mola
    private readonly GROUND_Y = -3.5;
    private readonly TRACK_LEN = 5000;
    private readonly Z_START = -50;
    private readonly TABLE_H = 0.4;
    private readonly REST = 3.2;
    private readonly C_OFFSET = 1.9;
    private readonly FOOT_W = 0.8;
    private readonly FOOT_H = 0.5;
    private readonly COILS = 7;
    private readonly SEGS_COIL = 8;
    private readonly HELIX_R = 0.18;
    private readonly TUBE_R = 0.04;
    private N_PTS: number = 0;

    // Meshes
    private camera!: ArcRotateCamera;
    private table!: Mesh;
    private tableAgg!: PhysicsAggregate;
    private legs: LegData[] = [];
    private activeKey!: Mesh;
    private finishLines: InstancedMesh[] = [];
    private baseFinishLine!: Mesh;

    // Pontos das molas helicoidais (4 pernas × N_PTS vetores)
    private helixPts: Vector3[][] = [];

    // Vetores de trabalho reutilizados para evitar GC
    private readonly _axis = Vector3.Zero();
    private readonly _aux  = Vector3.Zero();
    private readonly _rght = Vector3.Zero();
    private readonly _up   = Vector3.Zero();
    private readonly _aPos = Vector3.Zero();
    private readonly _mPos = Vector3.Zero();
    private readonly _dlt  = Vector3.Zero();
    private readonly _fSpr = Vector3.Zero();
    private readonly _vRel = Vector3.Zero();
    private readonly _fTot = Vector3.Zero();

    // Sons
    private impactSound: AbstractSound | null = null;

    // Partículas
    private keyConfetti!: ParticleSystem;
    private pyroLeft!: ParticleSystem;
    private pyroRight!: ParticleSystem;
    private dustSystem!: ParticleSystem;

    // Emoji / animação
    private emojiTex!: DynamicTexture;
    private currentEmoji: string = "";
    private keyAnimationTime: number = 0;

    // Callbacks para o Controller pausar/retomar a música de fundo
    private onGameOverCallback: (() => void) | null = null;
    private onGameResumeCallback: (() => void) | null = null;

    // Observers (para remoção no dispose)
    private gameLoopObserver: Observer<Scene> | null = null;
    private guiAnimObserver: Observer<Scene> | null = null;
    private keyboardObserver: Observer<KeyboardInfo> | null = null;

    // Idioma atual (0 = PT, 1 = EN)
    private currentLang: number = 0;
    private sliderLabelUpdaters: Array<() => void> = [];
    private reminderTxt!: TextBlock;
    private resetBtnRef!: Button;

    // GUI do jogo (separada da GUI do menu)
    private ui!: AdvancedDynamicTexture;
    private bestTxt!: TextBlock;
    private keysTxt!: TextBlock;
    private bestVelTxt!: TextBlock;
    private distTxt!: TextBlock;
    private velTxt!: TextBlock;
    private milestoneTxt!: TextBlock;

    constructor(scene: Scene) {
        this.scene = scene;
        this.bestDist = parseFloat(localStorage.getItem('qwop_best_dist') ?? '0');
        this.bestVel  = parseFloat(localStorage.getItem('qwop_best_vel')  ?? '0');
    }

    public async start(): Promise<void> {
        this.N_PTS = this.COILS * this.SEGS_COIL + 1;

        RegisterJoinedPhysicsEngineComponent();
        const wasmUrl = new URL("assets/wasm/HavokPhysics.wasm", document.baseURI).href;
        const havok = await HavokPhysics({ locateFile: () => wasmUrl });
        this.plugin = new HavokPlugin(true, havok);
        if (!this.scene.enablePhysics(new Vector3(0, -9.81, 0), this.plugin)) {
            throw new Error("QWOPGame: enablePhysics falhou — physics engine não registrada.");
        }

        this.setupCamera();
        this.setupLights();
        this.buildTrack();
        this.buildParticles();
        this.buildTable();
        this.buildLegs();
        this.setupGameLoop();
        this.setupKeyboard();
        this.buildGUI();
        CreateSoundAsync("impact", "./assets/sounds/universfield-ground-impact-352053.mp3", { loop: false })
            .then(s => { this.impactSound = s; });
    }

    // ── CÂMERA ────────────────────────────────────────────────────────────────

    private setupCamera(): void {
        const canvas = this.scene.getEngine().getRenderingCanvas()!;
        this.camera = new ArcRotateCamera(
            "qwopCam", -Math.PI / 3, Math.PI / 2.4, 20,
            new Vector3(0, -0.5, 0), this.scene
        );
        this.camera.lowerRadiusLimit = 8;
        this.camera.upperRadiusLimit = 40;
        this.camera.attachControl(canvas, true);
        this.scene.activeCamera = this.camera;
    }

    // ── ILUMINAÇÃO ────────────────────────────────────────────────────────────

    private setupLights(): void {
        const hemi = new HemisphericLight("qwopHemi", new Vector3(0, 1, 0), this.scene);
        hemi.intensity   = 0.7;
        hemi.diffuse     = new Color3(0.55, 0.75, 1.0);
        hemi.groundColor = new Color3(0.30, 0.52, 0.18);

        const dir = new DirectionalLight("qwopDir", new Vector3(-1.5, -3, -1), this.scene);
        dir.intensity = 1.1;
        dir.diffuse   = new Color3(1.0,  0.96, 0.82);
        dir.specular  = new Color3(0.6,  0.5,  0.3);
        dir.position.set(8, 14, -5);
    }

    // ── HELPER DE MATERIAL ────────────────────────────────────────────────────

    private mkMat(r: number, g: number, b: number, spec = 0.4, alpha = 1): StandardMaterial {
        const m = new StandardMaterial("", this.scene);
        m.diffuseColor  = new Color3(r, g, b);
        m.specularColor = new Color3(spec, spec, spec);
        m.alpha = alpha;
        return m;
    }

    // ── PISTA ─────────────────────────────────────────────────────────────────

    private buildTrack(): void {
        // Chão físico
        const ground = MeshBuilder.CreateBox(
            "ground", { width: 15, height: 0.3, depth: this.TRACK_LEN }, this.scene
        );
        ground.position.set(0, this.GROUND_Y, this.TRACK_LEN / 2 + this.Z_START);
        ground.material = this.mkMat(0.545, 0.18, 0.0, 0.02);
        new PhysicsAggregate(
            ground, PhysicsShapeType.BOX,
            { mass: 0, restitution: 0.1, friction: 0.8 }, this.scene
        );

        // Superfície visual da pista
        const trackSurface = MeshBuilder.CreatePlane(
            "track", { width: 15, height: this.TRACK_LEN }, this.scene
        );
        trackSurface.rotation.x = Math.PI / 2;
        trackSurface.position.set(0, this.GROUND_Y + 0.16, this.TRACK_LEN / 2 + this.Z_START);
        const trackMat = new StandardMaterial("trackMat", this.scene);
        trackMat.diffuseColor    = new Color3(0.49, 0.18, 0.02);
        trackMat.specularColor   = new Color3(0.04, 0.02, 0.0);
        trackMat.backFaceCulling = false;
        trackSurface.material    = trackMat;

        // Linhas de raia
        const laneMat = new StandardMaterial("laneMat", this.scene);
        laneMat.diffuseColor    = new Color3(1, 1, 1);
        laneMat.alpha           = 0.7;
        laneMat.backFaceCulling = false;
        for (let i = 1; i <= 7; i++) {
            const lane = MeshBuilder.CreatePlane(`lane_${i}`,
                { width: 0.1, height: this.TRACK_LEN }, this.scene);
            lane.rotation.x = Math.PI / 2;
            lane.position.set(-7.5 + (15 / 8) * i, this.GROUND_Y + 0.17, this.TRACK_LEN / 2 + this.Z_START);
            lane.material = laneMat;
        }

        // Grama lateral
        const grassMat = new StandardMaterial("grassMat", this.scene);
        grassMat.diffuseColor  = new Color3(0.09, 0.33, 0.09);
        grassMat.specularColor = new Color3(0, 0, 0);
        [-1, 1].forEach(side => {
            const g = MeshBuilder.CreateBox(`grass_${side}`,
                { width: 50, height: 0.24, depth: this.TRACK_LEN }, this.scene);
            g.position.set(side * 32.5, this.GROUND_Y + 0.01, this.TRACK_LEN / 2 + this.Z_START);
            g.material = grassMat;
        });

        // Postes e bandeiras decorativas
        const poleMat = new StandardMaterial("poleMat", this.scene);
        poleMat.diffuseColor = new Color3(0.88, 0.88, 0.9);
        const basePole = MeshBuilder.CreateCylinder("basePole",
            { height: 5.5, diameter: 0.13 }, this.scene);
        basePole.material  = poleMat;
        basePole.isVisible = false;

        const FLAG_MATS = [
            new Color3(1.0, 0.2, 0.2), new Color3(0.2, 0.55, 1.0),
            new Color3(1.0, 0.85, 0.1), new Color3(0.2, 0.82, 0.32),
        ];
        for (let z = this.Z_START; z <= 200; z += 20) {
            if (z < -10) continue;
            const zIdx = Math.round(z / 20);
            [-1, 1].forEach((side, si) => {
                const pole = basePole.createInstance(`pole_${z}_${side}`);
                pole.position.set(side * 8.5, this.GROUND_Y + 2.75, z);

                const flag = MeshBuilder.CreatePlane(`flag_${z}_${side}`,
                    { width: 1.1, height: 0.65 }, this.scene);
                flag.position.set(side * (8.5 + 0.55), this.GROUND_Y + 5.18, z);

                const colorIdx = Math.abs((zIdx + si) % FLAG_MATS.length);
                const baseColor = FLAG_MATS[colorIdx];
                const fm = new StandardMaterial(`fm_${z}_${si}`, this.scene);
                fm.diffuseColor   = baseColor.clone();
                fm.emissiveColor  = new Color3(
                    baseColor.r * 0.35, baseColor.g * 0.35, baseColor.b * 0.35
                );
                fm.backFaceCulling = false;
                flag.material = fm;
            });
        }

        // Linha de chegada xadrez (base oculta para instâncias)
        const ROWS   = 2;
        const LINE_H = ROWS * 0.8;
        const checkerTex = new DynamicTexture(
            "checkerTex", { width: 512, height: 64 * ROWS }, this.scene, false
        );
        const ctx  = checkerTex.getContext();
        const wRes = 512 / 15;
        const hRes = (64 * ROWS) / ROWS;
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < ROWS; j++) {
                ctx.fillStyle = (i + j) % 2 === 0 ? "#ffffff" : "#000000";
                ctx.fillRect(i * wRes, j * hRes, wRes, hRes);
            }
        }
        checkerTex.update();
        const checkerMat = new StandardMaterial("checker", this.scene);
        checkerMat.diffuseTexture   = checkerTex;
        checkerMat.backFaceCulling  = false;
        checkerMat.specularColor    = new Color3(0, 0, 0);

        this.baseFinishLine = MeshBuilder.CreatePlane(
            "baseFinish", { width: 15, height: LINE_H }, this.scene
        );
        this.baseFinishLine.rotation.x = Math.PI / 2;
        this.baseFinishLine.material   = checkerMat;
        this.baseFinishLine.isVisible  = false;
        this.finishLines.push(this.spawnFinishLine(10));

        // Chave coletável
        this.activeKey = this.buildKeyMesh();
        this.activeKey.position.set(0, this.GROUND_Y + 1.2, 10);
    }

    private spawnFinishLine(z: number): InstancedMesh {
        const fl = this.baseFinishLine.createInstance("finish_" + z);
        fl.position.set(0, this.GROUND_Y + 0.22, z);
        return fl;
    }

    private buildKeyMesh(): Mesh {
        const head  = MeshBuilder.CreateTorus("head",  { diameter: 0.4, thickness: 0.1 }, this.scene);
        head.rotation.x = Math.PI / 2;
        head.position.y = 0.3;
        const shaft  = MeshBuilder.CreateCylinder("shaft",  { height: 0.6, diameter: 0.1 }, this.scene);
        const tooth1 = MeshBuilder.CreateBox("tooth1", { width: 0.2, height: 0.1, depth: 0.1 }, this.scene);
        tooth1.position.set(0.15, -0.1, 0);
        const tooth2 = MeshBuilder.CreateBox("tooth2", { width: 0.2, height: 0.1, depth: 0.1 }, this.scene);
        tooth2.position.set(0.15, -0.3, 0);

        const keyMesh = Mesh.MergeMeshes([head, shaft, tooth1, tooth2], true, true, undefined, false, true)!;
        const mat = new StandardMaterial("keyMat", this.scene);
        mat.diffuseColor  = new Color3(1, 0.8, 0);
        mat.emissiveColor = new Color3(0.5, 0.4, 0);
        mat.specularColor = new Color3(1, 1, 1);
        keyMesh.material  = mat;
        return keyMesh;
    }

    // ── PARTÍCULAS ────────────────────────────────────────────────────────────

    private buildParticles(): void {
        const flareTexture = new Texture("https://assets.babylonjs.com/textures/flare.png", this.scene);
        const smokeTexture = new Texture("https://assets.babylonjs.com/textures/cloud.png", this.scene);

        // Confete da chave
        this.keyConfetti = new ParticleSystem("keyConfetti", 300, this.scene);
        this.keyConfetti.particleTexture = flareTexture;
        this.keyConfetti.minSize = 0.15;  this.keyConfetti.maxSize = 0.55;
        this.keyConfetti.minLifeTime = 1.0; this.keyConfetti.maxLifeTime = 2.5;
        this.keyConfetti.emitRate = 0;
        this.keyConfetti.minEmitPower = 4; this.keyConfetti.maxEmitPower = 10;
        this.keyConfetti.updateSpeed = 0.02;
        this.keyConfetti.direction1  = new Vector3(-4, 10, -2);
        this.keyConfetti.direction2  = new Vector3( 4, 16,  2);
        this.keyConfetti.gravity     = new Vector3(0, -7, 0);
        this.keyConfetti.color1      = new Color4(1.0, 0.35, 0.0, 1);
        this.keyConfetti.color2      = new Color4(0.1, 0.6,  1.0, 1);
        this.keyConfetti.colorDead   = new Color4(1,   1,    0,   0);
        this.keyConfetti.start();

        // Pirotecnia das linhas de chegada
        this.pyroLeft  = this.createPyro(true,  flareTexture);
        this.pyroRight = this.createPyro(false, flareTexture);

        // Poeira do tombo
        this.dustSystem = new ParticleSystem("dust", 200, this.scene);
        this.dustSystem.particleTexture = smokeTexture;
        this.dustSystem.minSize = 1.5;  this.dustSystem.maxSize = 4.0;
        this.dustSystem.minLifeTime = 1.5; this.dustSystem.maxLifeTime = 3.0;
        this.dustSystem.emitRate = 0;
        this.dustSystem.minEmitPower = 2; this.dustSystem.maxEmitPower = 6;
        this.dustSystem.updateSpeed  = 0.015;
        this.dustSystem.direction1   = new Vector3(-5, 0.5, -5);
        this.dustSystem.direction2   = new Vector3( 5, 2.5,  5);
        this.dustSystem.gravity      = new Vector3(0, 0.5, 0);
        this.dustSystem.color1       = new Color4(0.6, 0.3, 0.1, 0.6);
        this.dustSystem.color2       = new Color4(0.5, 0.2, 0.1, 0.4);
        this.dustSystem.colorDead    = new Color4(0.4, 0.2, 0.1, 0.0);
        this.dustSystem.blendMode    = ParticleSystem.BLENDMODE_STANDARD;
        this.dustSystem.start();
    }

    private createPyro(isLeft: boolean, tex: Texture): ParticleSystem {
        const ps = new ParticleSystem("pyro", 800, this.scene);
        ps.particleTexture = tex;
        ps.minSize = 0.15; ps.maxSize = 0.45;
        ps.minLifeTime = 1.0; ps.maxLifeTime = 2.5;
        ps.emitRate = 0;
        ps.minEmitPower = 8; ps.maxEmitPower = 15;
        ps.updateSpeed = 0.01;
        const sign = isLeft ? 1 : -1;
        ps.direction1 = new Vector3(sign * 2, 8, -2);
        ps.direction2 = new Vector3(sign * 5, 14, 2);
        ps.gravity    = new Vector3(0, -4.5, 0);
        ps.color1     = new Color4(1, 1, 0.3, 1);
        ps.color2     = new Color4(1, 0.4, 0,   1);
        ps.colorDead  = new Color4(0.5, 0, 0,   0);
        ps.blendMode  = ParticleSystem.BLENDMODE_ADD;
        ps.start();
        return ps;
    }

    // ── MESA ─────────────────────────────────────────────────────────────────

    private buildTable(): void {
        this.table = MeshBuilder.CreateBox(
            "table", { width: 4.5, height: this.TABLE_H, depth: 4.5 }, this.scene
        );
        this.table.position.set(0, 1.5, 0);
        this.table.rotationQuaternion = Quaternion.Identity();
        this.table.material = this.mkMat(0.52, 0.44, 0.34, 0.15);

        // Emoji no tampo da mesa
        const emojiPlane = MeshBuilder.CreatePlane("emojiPlane", { width: 4.5, height: 4.5 }, this.scene);
        emojiPlane.rotation.x = Math.PI / 2;
        emojiPlane.position.y = this.TABLE_H / 2 + 0.01;
        emojiPlane.parent     = this.table;

        this.emojiTex = new DynamicTexture("emojiTex", { width: 512, height: 512 }, this.scene, true);
        this.emojiTex.hasAlpha = true;
        const emojiMat = new StandardMaterial("emojiMat", this.scene);
        emojiMat.diffuseTexture  = this.emojiTex;
        emojiMat.emissiveTexture = this.emojiTex;
        emojiMat.useAlphaFromDiffuseTexture = true;
        emojiMat.backFaceCulling = false;
        emojiPlane.material = emojiMat;
        this.setEmoji("😃");

        this.tableAgg = new PhysicsAggregate(
            this.table, PhysicsShapeType.BOX,
            { mass: this.tableMass, restitution: 0.1, friction: 0.5 }, this.scene
        );
        this.tableAgg.body.setGravityFactor(1);
        this.tableAgg.body.setLinearDamping(0.5);
        this.tableAgg.body.setMassProperties({ mass: this.tableMass, inertia: new Vector3(0, 0, 0) });
    }

    // ── PERNAS / MOLAS ────────────────────────────────────────────────────────

    private buildLegs(): void {
        const cornersLocal = [
            new Vector3( this.C_OFFSET, -this.TABLE_H / 2,  this.C_OFFSET),
            new Vector3(-this.C_OFFSET, -this.TABLE_H / 2,  this.C_OFFSET),
            new Vector3( this.C_OFFSET, -this.TABLE_H / 2, -this.C_OFFSET),
            new Vector3(-this.C_OFFSET, -this.TABLE_H / 2, -this.C_OFFSET),
        ];
        const footMats = [
            this.mkMat(0.2, 0.8, 0.2), this.mkMat(0.8, 0.2, 0.2),
            this.mkMat(0.8, 0.8, 0.2), this.mkMat(0.2, 0.5, 0.9),
        ];
        const springMat = this.mkMat(0.88, 0.78, 0.12, 0.9);

        this.helixPts = Array.from({ length: 4 }, () =>
            Array.from({ length: this.N_PTS }, () => Vector3.Zero())
        );

        for (let i = 0; i < 4; i++) {
            const foot = MeshBuilder.CreateBox("f" + i,
                { width: this.FOOT_W, height: this.FOOT_H, depth: this.FOOT_W }, this.scene);
            foot.position.set(cornersLocal[i].x, this.GROUND_Y + this.FOOT_H / 2, cornersLocal[i].z);
            foot.rotationQuaternion = Quaternion.Identity();
            foot.material = footMats[i];

            const footAgg = new PhysicsAggregate(foot, PhysicsShapeType.BOX,
                { mass: this.sMass, friction: 0.9 }, this.scene);
            footAgg.body.setMassProperties({ mass: this.sMass, inertia: new Vector3(0, 0, 0) });

            const springMesh = MeshBuilder.CreateTube("s" + i, {
                path: this.helixPts[i], radius: this.TUBE_R,
                tessellation: 6, updatable: true, cap: Mesh.CAP_ALL,
            }, this.scene) as Mesh;
            springMesh.material = springMat;

            this.legs.push({ localAnchor: cornersLocal[i], foot, footAgg, springMesh });
        }
    }

    // ── EMOJI ─────────────────────────────────────────────────────────────────

    private setEmoji(emoji: string): void {
        if (this.currentEmoji === emoji) return;
        this.currentEmoji = emoji;
        const eCtx = this.emojiTex.getContext() as unknown as CanvasRenderingContext2D;
        eCtx.clearRect(0, 0, 512, 512);
        eCtx.font         = "400px Arial";
        eCtx.textAlign    = "center";
        eCtx.textBaseline = "middle";
        eCtx.fillText(emoji, 256, 280);
        this.emojiTex.update();
    }

    // ── AÇÕES DO JOGO ─────────────────────────────────────────────────────────

    private pushFoot(idx: number): void {
        if (this.gameState !== "PLAYING") return;
        const footBottomY    = this.legs[idx].foot.position.y - this.FOOT_H / 2;
        const groundSurfaceY = this.GROUND_Y + 0.15;
        if (footBottomY > groundSurfaceY + 0.1) return;
        this.legs[idx].footAgg.body.applyImpulse(
            new Vector3(0, 8, 12),
            this.legs[idx].foot.getAbsolutePosition()
        );
    }

    private resetGame(): void {
        this.onGameResumeCallback?.();
        this.tableAgg.body.setLinearVelocity(Vector3.Zero());
        this.tableAgg.body.setAngularVelocity(Vector3.Zero());
        this.table.position.set(0, 1.5, 0);
        this.table.rotationQuaternion!.set(0, 0, 0, 1);
        this.tableAgg.body.disablePreStep = false;

        this.legs.forEach((l, i) => {
            l.footAgg.body.setLinearVelocity(Vector3.Zero());
            l.footAgg.body.setAngularVelocity(Vector3.Zero());
            l.foot.position.set(this.legs[i].localAnchor.x, this.GROUND_Y + 0.25, this.legs[i].localAnchor.z);
            l.foot.rotationQuaternion!.set(0, 0, 0, 1);
            l.footAgg.body.disablePreStep = false;
        });

        this.camera.alpha  = -Math.PI / 3;
        this.camera.beta   = Math.PI / 2.4;
        this.camera.radius = 20;
        this.camera.target.set(0, -0.5, 0);
        this.gameState = "PLAYING";

        this.setEmoji("😃");

        this.nextMilestone = 10;
        this.finishLines.forEach(fl => fl.dispose());
        this.finishLines.length = 0;
        this.finishLines.push(this.spawnFinishLine(10));

        this.activeKey.position.z = this.nextKeyZ;
        this.activeKey.isVisible  = this.totalKeysFound < 5;

        this.lastDist      = 0;
        this.distTxt.color = "white";
        this.distTxt.text  = this.currentLang === 0 ? "Distância: 0.0 m"   : "Distance: 0.0 m";
        this.velTxt.color  = "white";
        this.velTxt.text   = this.currentLang === 0 ? "Velocidade: 0.0 m/s" : "Velocity: 0.0 m/s";
        this.milestoneTxt.text = "";
    }

    // ── MOLA HELICOIDAL (atualização geométrica) ──────────────────────────────

    private updateHelix(pts: Vector3[], anchorPos: Vector3, massPos: Vector3): void {
        const N      = this.N_PTS;
        const HR     = this.HELIX_R;
        const TPC    = 2 * Math.PI * this.COILS;

        this._dlt.copyFrom(massPos).subtractInPlace(anchorPos);
        const len = this._dlt.length();
        if (len < 0.001) { pts.forEach(p => p.copyFrom(anchorPos)); return; }

        this._axis.copyFrom(this._dlt).scaleInPlace(1 / len);

        if (Math.abs(this._axis.z) > 0.9) this._aux.set(1, 0, 0);
        else                               this._aux.set(0, 0, 1);

        Vector3.CrossToRef(this._axis, this._aux, this._rght); this._rght.normalize();
        Vector3.CrossToRef(this._rght, this._axis, this._up);  this._up.normalize();

        const { x: ax, y: ay, z: az } = this._axis;
        const { x: rx, y: ry, z: rz } = this._rght;
        const { x: ux, y: uy, z: uz } = this._up;
        const { x: ox, y: oy, z: oz } = anchorPos;

        for (let i = 0; i < N; i++) {
            const t   = i / (N - 1);
            const ang = t * TPC;
            const tl  = t * len;
            const c   = Math.cos(ang) * HR;
            const s   = Math.sin(ang) * HR;
            pts[i].x  = ox + ax * tl + rx * c + ux * s;
            pts[i].y  = oy + ay * tl + ry * c + uy * s;
            pts[i].z  = oz + az * tl + rz * c + uz * s;
        }
    }

    // ── PARTÍCULAS: TRIGGERS ──────────────────────────────────────────────────

    private triggerKeyConfetti(pos: Vector3): void {
        this.keyConfetti.emitter       = pos.clone();
        this.keyConfetti.manualEmitCount = 100;
    }

    private triggerPyro(zPos: number): void {
        this.pyroLeft.emitter  = new Vector3(-7.5, this.GROUND_Y, zPos);
        this.pyroRight.emitter = new Vector3( 7.5, this.GROUND_Y, zPos);
        this.pyroLeft.manualEmitCount  = 350;
        this.pyroRight.manualEmitCount = 350;
    }

    private triggerDust(pos: Vector3): void {
        const e = pos.clone();
        e.y = this.GROUND_Y + 0.2;
        this.dustSystem.emitter       = e;
        this.dustSystem.manualEmitCount = 100;
    }

    // ── LOOP PRINCIPAL ────────────────────────────────────────────────────────

    private setupGameLoop(): void {
        this.gameLoopObserver = this.scene.onBeforeRenderObservable.add(() => {
            this.table.computeWorldMatrix(true);
            // Câmera segue a mesa no eixo Z
            this.camera.target.z += (this.table.position.z - this.camera.target.z) * 0.1;

            // Animação da chave flutuante
            this.keyAnimationTime    += 0.05;
            this.activeKey.rotation.y += 0.03;
            this.activeKey.position.y  = this.GROUND_Y + 1.2 + Math.sin(this.keyAnimationTime) * 0.2;

            if (this.gameState === "PLAYING") {
                const tableBottomY   = this.table.position.y - this.TABLE_H / 2;
                const groundSurfaceY = this.GROUND_Y + 0.15;
                const currentVel     = this.tableAgg.body.getLinearVelocity().z;

                // Detecta tombo
                let over = tableBottomY <= groundSurfaceY + 0.1;
                if (!over) {
                    this.legs.forEach(leg => {
                        if (tableBottomY <= leg.foot.position.y + this.FOOT_H / 2 + 0.05) over = true;
                    });
                }

                if (over) {
                    this.impactSound?.play();
                    this.onGameOverCallback?.();
                    this.triggerDust(this.table.getAbsolutePosition());
                    this.setEmoji("😵");

                    const finalDist = this.table.position.z;
                    if (finalDist > this.bestDist) {
                        this.bestDist = finalDist;
                        this.bestTxt.text = `🏆 ${this.fmt(this.bestDist, 1)} m`;
                    }
                    if (currentVel > this.bestVel) {
                        this.bestVel = currentVel;
                        this.bestVelTxt.text = `⚡ ${this.fmt(this.bestVel, 1)} m/s`;
                    }
                    // Salva sempre os picos já atualizados (não o currentVel do tombo)
                    localStorage.setItem('qwop_best_dist', this.bestDist.toString());
                    localStorage.setItem('qwop_best_vel',  this.bestVel.toString());

                    this.gameState = "GAMEOVER";
                    this.lastDist = finalDist;
                    this.distTxt.text  = this.currentLang === 0 ? `Distância: ${this.fmt(finalDist, 1)} m` : `Distance: ${this.fmt(finalDist, 1)} m`;
                    this.distTxt.color = finalDist >= 10 ? "#00CC66" : "#FF4444";
                    this.velTxt.text   = this.currentLang === 0 ? "Velocidade: 0.0 m/s" : "Velocity: 0.0 m/s";
                    this.velTxt.color  = "#FF4444";
                    this.milestoneTxt.text = "";
                } else {
                    const traveled = this.table.position.z;

                    if (traveled > this.bestDist) {
                        this.bestDist = traveled;
                        this.bestTxt.text = `🏆 ${this.fmt(this.bestDist, 1)} m`;
                    }
                    if (currentVel > this.bestVel) {
                        this.bestVel = currentVel;
                        this.bestVelTxt.text = `⚡ ${this.fmt(this.bestVel, 1)} m/s`;
                    }

                    // Coleta de chave
                    if (this.activeKey.isVisible && traveled >= this.activeKey.position.z - 0.5) {
                        this.totalKeysFound++;
                        this.keysCount++;
                        this.keysTxt.text = this.currentLang === 0 ? `🔑 Chaves: ${this.keysCount}` : `🔑 Keys: ${this.keysCount}`;
                        this.triggerKeyConfetti(this.activeKey.position);

                        if (this.totalKeysFound < 5) {
                            this.nextKeyZ += 10;
                            this.activeKey.position.z = this.nextKeyZ;
                        } else {
                            this.activeKey.isVisible = false;
                        }
                    }

                    // Marco de distância
                    if (traveled >= this.nextMilestone) {
                        const crossedLineZ = this.nextMilestone;
                        this.nextMilestone += 10;
                        this.finishLines.push(this.spawnFinishLine(this.nextMilestone));
                        this.triggerPyro(crossedLineZ);
                        this.milestoneTxt.text  = `🏁 +10 m!`;
                        this.milestoneTxt.color = "#00FF88";
                        setTimeout(() => { this.milestoneTxt.text = ""; }, 2000);
                    }

                    this.distTxt.text = this.currentLang === 0 ? `Distância: ${this.fmt(traveled, 1)} m` : `Distance: ${this.fmt(traveled, 1)} m`;
                    this.velTxt.text  = this.currentLang === 0 ? `Velocidade: ${this.fmt(currentVel, 1)} m/s` : `Velocity: ${this.fmt(currentVel, 1)} m/s`;
                }
            }

            // Atualiza molas e aplica forças massa-mola em cada perna
            const wm = this.table.getWorldMatrix();
            for (let i = 0; i < 4; i++) {
                const leg = this.legs[i];
                Vector3.TransformCoordinatesToRef(leg.localAnchor, wm, this._aPos);
                this._mPos.copyFrom(leg.foot.position);
                this._mPos.y += this.FOOT_H / 2;
                this._mPos.subtractToRef(this._aPos, this._dlt);

                const len = this._dlt.length();
                if (len < 0.001) continue;

                this._fSpr.copyFrom(this._dlt).scaleInPlace(-this.k * (len - this.REST) / len);
                const vFoot  = leg.footAgg.body.getLinearVelocity();
                const vTable = this.tableAgg.body.getLinearVelocity();
                vFoot.subtractToRef(vTable, this._vRel);
                this._vRel.scaleInPlace(-this.damping);
                this._fSpr.addToRef(this._vRel, this._fTot);

                leg.footAgg.body.applyForce(this._fTot, leg.foot.getAbsolutePosition());
                this._fTot.scaleInPlace(-1);
                this.tableAgg.body.applyForce(this._fTot, this._aPos);

                this.updateHelix(this.helixPts[i], this._aPos, this._mPos);
                MeshBuilder.CreateTube("s" + i, { path: this.helixPts[i], instance: leg.springMesh });
            }
        });
    }

    // ── TECLADO ───────────────────────────────────────────────────────────────

    private setupKeyboard(): void {
        this.keyboardObserver = this.scene.onKeyboardObservable.add((kb) => {
            if (kb.type !== KeyboardEventTypes.KEYDOWN) return;
            const key = kb.event.key.toLowerCase();
            if (key === 'q') this.pushFoot(1);
            if (key === 'w') this.pushFoot(0);
            if (key === 'o') this.pushFoot(3);
            if (key === 'p') this.pushFoot(2);
            if (key === ' ' || kb.event.code === "Space") this.resetGame();
        });
    }

    // ── GUI DO JOGO ───────────────────────────────────────────────────────────

    private buildGUI(): void {
        this.ui = AdvancedDynamicTexture.CreateFullscreenUI("UI");

        const mkTB = (name: string, text: string, color: string, size: number): TextBlock => {
            const tb = new TextBlock(name, text);
            tb.color      = color;
            tb.fontSize   = size;
            tb.fontWeight = "bold";
            return tb;
        };

        // Marcadores de recorde (topo)
        this.bestTxt    = mkTB("best",    `🏆 ${this.fmt(this.bestDist, 1)} m`,  "#FFD700", 14);
        this.keysTxt    = mkTB("keys",    "🔑 Chaves: 0",                        "#FFD700", 14);
        this.bestVelTxt = mkTB("bestVel", `⚡ ${this.fmt(this.bestVel, 1)} m/s`, "#FFD700", 14);
        [this.bestTxt, this.keysTxt, this.bestVelTxt].forEach(tb => {
            tb.shadowColor   = "rgba(0,0,0,0.9)";
            tb.shadowBlur    = 5;
            tb.shadowOffsetX = 1;
            tb.shadowOffsetY = 2;
        });

        // Distância / velocidade atual
        this.distTxt = mkTB("dist", "Distância: 0.0 m",   "white", 16);
        this.velTxt  = mkTB("vel",  "Velocidade: 0.0 m/s","white", 16);

        // Marco de distância
        this.milestoneTxt = mkTB("milestone", "", "#00FF88", 20);
        this.milestoneTxt.height                  = "30px";
        this.milestoneTxt.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;

        // Barra superior: [🏆 recorde] | [🔑 chaves] | [⚡ vel. máx]
        const topBar = new Grid();
        topBar.width             = "100%";
        topBar.height            = "46px";
        topBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        topBar.background        = "rgba(0,0,0,0.50)";
        topBar.addColumnDefinition(0.33);
        topBar.addColumnDefinition(0.34);
        topBar.addColumnDefinition(0.33);
        this.ui.addControl(topBar);

        topBar.addControl(this.bestTxt,    0, 0);
        topBar.addControl(this.keysTxt,    0, 1);
        topBar.addControl(this.bestVelTxt, 0, 2);

        // Painel de sliders (começa logo abaixo da barra superior)
        const rootPanel = new StackPanel();
        rootPanel.width               = "95%";
        rootPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        rootPanel.verticalAlignment   = Control.VERTICAL_ALIGNMENT_TOP;
        rootPanel.paddingTop          = "52px";
        this.ui.addControl(rootPanel);

        const COLOR_LOCKED   = "#555566";
        const COLOR_UNLOCKED = "#4AADFF";

        const addSlider = (
            labels: [string, string], unit: string, min: number, max: number,
            init: number, dec: number, onChange: (v: number) => void
        ): void => {
            const row = new Grid();
            row.width  = "100%";
            row.height = "26px";
            row.addColumnDefinition(165, true);
            row.addColumnDefinition(1,   false);
            row.addColumnDefinition(26,  true);
            rootPanel.addControl(row);

            let currentVal = init;
            const lbl = new TextBlock();
            lbl.color    = "white";
            lbl.fontSize = 13;
            lbl.text     = `${labels[this.currentLang]}: ${this.fmt(init, dec)} ${unit}`;
            lbl.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            row.addControl(lbl, 0, 0);

            this.sliderLabelUpdaters.push(() => {
                lbl.text = `${labels[this.currentLang]}: ${this.fmt(currentVal, dec)} ${unit}`;
            });

            const slider = new Slider();
            slider.minimum    = min;
            slider.maximum    = max;
            slider.value      = init;
            slider.height     = "14px";
            slider.width      = "90%";
            slider.color      = COLOR_LOCKED;
            slider.background = "#222233";
            slider.thumbColor = COLOR_LOCKED;
            slider.isEnabled  = false;
            row.addControl(slider, 0, 1);

            const overlay = Button.CreateSimpleButton("ov", "");
            overlay.thickness  = 0;
            overlay.background = "transparent";
            overlay.zIndex     = 10;
            row.addControl(overlay, 0, 1);

            const lockBtn = Button.CreateSimpleButton("lb", "🔒");
            lockBtn.width      = "24px";
            lockBtn.height     = "80%";
            lockBtn.fontSize   = 12;
            lockBtn.color      = "white";
            lockBtn.background = "transparent";
            lockBtn.thickness  = 0;
            row.addControl(lockBtn, 0, 2);

            slider.onValueChangedObservable.add((v: number) => {
                if (!slider.isEnabled) return;
                currentVal = v;
                lbl.text = `${labels[this.currentLang]}: ${this.fmt(v, dec)} ${unit}`;
                onChange(v);
            });

            let locked = true;
            const attemptUnlock = () => {
                if (!locked) return;
                if (this.keysCount > 0) {
                    this.keysCount--;
                    this.keysTxt.text = this.currentLang === 0 ? `🔑 Chaves: ${this.keysCount}` : `🔑 Keys: ${this.keysCount}`;
                    locked = false;
                    lockBtn.textBlock!.text = "🔓";
                    slider.isEnabled  = true;
                    slider.color      = COLOR_UNLOCKED;
                    slider.thumbColor = COLOR_UNLOCKED;
                    overlay.isVisible = false;
                } else {
                    this.keysTxt.color = "#FF4444";
                    setTimeout(() => { this.keysTxt.color = "#FFD700"; }, 250);
                }
            };
            lockBtn.onPointerClickObservable.add(attemptUnlock);
            overlay.onPointerClickObservable.add(attemptUnlock);
        };

        addSlider(["Rigidez k",    "Spring k"  ], "N/m",   10, 150, this.k,        1, (v: number) => { this.k = v; });
        addSlider(["Amortecedor b","Damper b"  ], "N·s/m",  0,  10, this.damping,  1, (v: number) => { this.damping = v; });
        addSlider(["Massa Pé",     "Foot Mass" ], "kg",   0.5,   5, this.sMass,    1, (v: number) => {
            this.sMass = v;
            this.legs.forEach(l => l.footAgg.body.setMassProperties({ mass: v, inertia: new Vector3(0, 0, 0) }));
        });
        addSlider(["Massa Mesa",   "Table Mass"], "kg",     5,  60, this.tableMass, 1, (v: number) => {
            this.tableMass = v;
            this.tableAgg.body.setMassProperties({ mass: v, inertia: new Vector3(0, 0, 0) });
        });
        addSlider(["Gravidade",    "Gravity"   ], "m/s²",  0,  30, 9.81, 2, (v: number) => {
            this.plugin.setGravity(new Vector3(0, -v, 0));
        });

        // Grid inferior: distância + velocidade
        const bottomGrid = new Grid();
        bottomGrid.width = "100%";
        bottomGrid.height = "45px";
        bottomGrid.addColumnDefinition(0.5);
        bottomGrid.addColumnDefinition(0.5);
        rootPanel.addControl(bottomGrid);
        bottomGrid.addControl(this.distTxt, 0, 0);
        bottomGrid.addControl(this.velTxt,  0, 1);
        rootPanel.addControl(this.milestoneTxt);

        // Lembrete piscante de chave disponível
        this.reminderTxt = new TextBlock("reminder", "💡 Clique em um 🔒 para usar a chave.");
        const reminderTxt = this.reminderTxt;
        reminderTxt.color           = "#FFD700";
        reminderTxt.fontSize        = 16;
        reminderTxt.fontWeight      = "bold";
        reminderTxt.fontStyle       = "italic";
        reminderTxt.height          = "40px";
        reminderTxt.verticalAlignment  = Control.VERTICAL_ALIGNMENT_BOTTOM;
        reminderTxt.paddingBottom      = "20px";
        reminderTxt.shadowColor        = "rgba(0,0,0,0.8)";
        reminderTxt.shadowBlur         = 4;
        reminderTxt.isVisible          = false;
        this.ui.addControl(reminderTxt);

        this.guiAnimObserver = this.scene.onBeforeRenderObservable.add(() => {
            if (this.keysCount > 0 && this.gameState === "PLAYING") {
                reminderTxt.isVisible = true;
                reminderTxt.alpha = 0.5 + Math.sin(Date.now() / 200) * 2.0;
            } else {
                reminderTxt.isVisible = false;
            }
        });

        // Controles mobile (QWOP + Reiniciar)
        const ctrlContainer = new Rectangle();
        ctrlContainer.width               = "90%";
        ctrlContainer.height              = "34%";
        ctrlContainer.thickness           = 0;
        ctrlContainer.verticalAlignment   = Control.VERTICAL_ALIGNMENT_BOTTOM;
        ctrlContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        ctrlContainer.paddingBottom       = "10%";
        this.ui.addControl(ctrlContainer);

        const btnGrid = new Grid();
        btnGrid.width  = "100%";
        btnGrid.height = "100%";
        btnGrid.addColumnDefinition(0.22);
        btnGrid.addColumnDefinition(0.56);
        btnGrid.addColumnDefinition(0.22);
        btnGrid.addRowDefinition(0.45);
        btnGrid.addRowDefinition(0.10);
        btnGrid.addRowDefinition(0.45);
        ctrlContainer.addControl(btnGrid);

        const mkFootBtn = (lab: string, bg: string, idx: number, row: number, col: number): void => {
            const btn = Button.CreateSimpleButton("", lab);
            btn.width        = "85%";
            btn.height       = "85%";
            btn.color        = "white";
            btn.background   = bg;
            btn.cornerRadius = 15;
            btn.fontSize     = 28;
            btn.fontWeight   = "bold";
            btn.onPointerDownObservable.add(() => this.pushFoot(idx));
            btnGrid.addControl(btn, row, col);
        };

        this.resetBtnRef = Button.CreateSimpleButton("res", "↺ Reiniciar\n(Barra de espaço)");
        const resetBtn = this.resetBtnRef;
        resetBtn.width        = "80%";
        resetBtn.height       = "70%";
        resetBtn.color        = "white";
        resetBtn.background   = "#444455";
        resetBtn.cornerRadius = 10;
        resetBtn.fontSize     = 14;
        resetBtn.fontWeight   = "bold";
        resetBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        resetBtn.onPointerClickObservable.add(() => this.resetGame());
        btnGrid.addControl(resetBtn, 2, 1);

        mkFootBtn("Q", "#CC3333", 1, 0, 0);
        mkFootBtn("O", "#3377CC", 3, 2, 0);
        mkFootBtn("W", "#33CC33", 0, 0, 2);
        mkFootBtn("P", "#CCCC33", 2, 2, 2);
    }

    public getBestDist(): number { return this.bestDist; }
    public getBestVel(): number  { return this.bestVel;  }

    public setOnGameOver(cb: () => void): void   { this.onGameOverCallback = cb; }
    public setOnGameResume(cb: () => void): void { this.onGameResumeCallback = cb; }

    private fmt(n: number, dec: number): string {
        const s = n.toFixed(dec);
        return this.currentLang === 0 ? s.replace('.', ',') : s;
    }

    public setLanguage(lang: number): void {
        this.currentLang = lang;
        this.sliderLabelUpdaters.forEach(fn => fn());
        this.bestTxt.text    = `🏆 ${this.fmt(this.bestDist, 1)} m`;
        this.bestVelTxt.text = `⚡ ${this.fmt(this.bestVel, 1)} m/s`;
        this.keysTxt.text    = lang === 0 ? `🔑 Chaves: ${this.keysCount}` : `🔑 Keys: ${this.keysCount}`;
        this.reminderTxt.text = lang === 0
            ? "💡 Clique em um 🔒 para usar a chave."
            : "💡 Click a 🔒 to use a key.";
        if (this.resetBtnRef.textBlock) {
            this.resetBtnRef.textBlock.text = lang === 0
                ? "↺ Reiniciar\n(Barra de espaço)"
                : "↺ Reset\n(Space bar)";
        }
        // Reconstrói dist/vel (necessário quando o jogo está em GAMEOVER e o loop não roda)
        if (this.gameState === "GAMEOVER") {
            this.distTxt.text = lang === 0 ? `Distância: ${this.fmt(this.lastDist, 1)} m` : `Distance: ${this.fmt(this.lastDist, 1)} m`;
            this.velTxt.text  = lang === 0 ? "Velocidade: 0.0 m/s" : "Velocity: 0.0 m/s";
        }
    }


    public dispose(): void {
        this.scene.onBeforeRenderObservable.remove(this.gameLoopObserver);
        this.scene.onBeforeRenderObservable.remove(this.guiAnimObserver);
        this.scene.onKeyboardObservable.remove(this.keyboardObserver);

        this.keyConfetti.dispose();
        this.pyroLeft.dispose();
        this.pyroRight.dispose();
        this.dustSystem.dispose();

        this.ui.dispose();

        this.scene.meshes.slice().forEach(m => m.dispose());
        this.scene.lights.slice().forEach(l => l.dispose());

        this.camera.detachControl();
        this.camera.dispose();

        this.scene.disablePhysicsEngine();
    }
}

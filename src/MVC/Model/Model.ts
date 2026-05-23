import { Scene } from "@babylonjs/core/scene";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";

import { IModel } from "./IModel";
import { SoundModel } from "./SoundModel";
import { GroundModel } from "./GroundModel";
import { MaterialFactory } from "./MaterialFactory";

export class Model implements IModel {
    private scene: Scene;
    private backgroundMusic?: SoundModel;
    private allSounds: SoundModel[] = [];
    private physicsPlugin: HavokPlugin | null;
    private endGameCallback: ((isVisible: boolean) => void) | null = null;
    public endGAme: boolean = false;
    public updateModels: boolean = false;

    private matFactory!: MaterialFactory;

    //TODO: Re-enable for future non-QWOP games:
    // private groundModel!: GroundModel;

    private needsRecalculation: boolean = false;
    private recalcTimer: number = 0;

    private unlockedLevels: number = 1;
    private levelScores: number[] = new Array(12).fill(0);

    private currentLevelIndex: number = 0;
    private scoreUpdateCallback: ((score: number, ref: number, refr: number, intRef: number, currentLevel: number) => void) | null = null;

    // Cache dos dados das fases do JSON
    private levelsData: any[] = [];
    private currentLevelData: any | null = null;

    constructor(scene: Scene, physicsPlugin?: HavokPlugin | null) {
        const savedScores = localStorage.getItem('snell_laser_scores');
        if (savedScores) this.levelScores = JSON.parse(savedScores);

        const savedLevels = localStorage.getItem('snell_laser_unlocked');
        if (savedLevels) this.unlockedLevels = parseInt(savedLevels);

        this.scene = scene;
        this.physicsPlugin = physicsPlugin || null;

        this.startMusic();

        //TODO: Re-enable for future non-QWOP games:
        // this.groundModel = new GroundModel(this.scene, 16, 32);
        this.matFactory = new MaterialFactory(this.scene);

        // ✨ LIMPEZA: Carregamento automático desabilitado - cena começa vazia
        // Descomente a linha abaixo para carregar o nível ao iniciar
        // this.loadLevel(0);
        this.updateSceneModels();
    }

    public getUnlockedLevels(): number { return this.unlockedLevels; }
    public getLevelScores(): number[] { return this.levelScores; }

    public resetProgress(): void {
        // 1. Reseta variáveis locais
        this.unlockedLevels = 1;
        this.levelScores = new Array(12).fill(0);
        this.endGAme = false;

        // 2. Limpa o armazenamento do navegador
        localStorage.removeItem('snell_laser_scores');
        localStorage.removeItem('snell_laser_unlocked');

        // ✨ LIMPEZA: Não recarrega fase automaticamente - cena permanece vazia
        // this.loadLevel(0);
    }
    // Limpa a tela antes de construir uma nova fase
    private clearCurrentLevel(): void {
        // Não há modelos de vidro ou bloco sendo construídos atualmente.
    }

    // Assíncrono: Baixa o JSON e constrói a fase lendo ele
    public async loadLevel(levelIndex: number): Promise<void> {
        this.currentLevelIndex = levelIndex;

        try {
            // Só baixa o arquivo na primeira vez
            if (this.levelsData.length === 0) {
                // ATUALIZADO: Adicionamos o getTime() para forçar o celular a ignorar o cache!
                const cacheBuster = new Date().getTime();
                const response = await fetch(`./assets/levels.json?v=${cacheBuster}`);
                this.levelsData = await response.json();
            }

            const levelData = this.levelsData[levelIndex];
            if (!levelData) {
                console.warn(`Fase ${levelIndex + 1} ainda não existe no levels.json!`);
                return;
            }

            this.clearCurrentLevel();
            this.currentLevelData = levelData;

            // 1. Nível carregado como metadados para uso futuro
            if (levelData.name) {
                console.log(`Carregando nível ${levelIndex + 1}: ${levelData.name}`);
            }

            if (levelData.emitter) {
                const emitterData = {
                    x: levelData.emitter.x,
                    z: levelData.emitter.z,
                    rotationY: levelData.emitter.rotationY,
                };
                console.log("Emitter data available:", emitterData);
            }

            // 2. Nível baseado em metadados registrando quantidades de objetos
            if (levelData.glasses) {
                console.log(`Glass items in level: ${levelData.glasses.length}`);
            }
            if (levelData.blocks) {
                console.log(`Block items in level: ${levelData.blocks.length}`);
            }

            // Força a recalcular estado do jogo se necessário
            this.triggerRecalculation();

        } catch (error) {
            console.error("Erro ao ler levels.json:", error);
        }
    }

    public getTotalBestScore(): number {
        return this.levelScores.reduce((acumulador, valorAtual) => acumulador + valorAtual, 0);
    }

    public setScoreUpdateCallback(callback: (score: number, reflections: number, refractions: number, intRef: number, currentLevel: number) => void): void {
        this.scoreUpdateCallback = callback;
    }

    public updateGameState(isWin: boolean, reflections: number, refractions: number, internalReflections: number): void {
        const currentScore = (reflections * 10) + (refractions * 20) + (internalReflections * 50);

        if (this.scoreUpdateCallback) {
            this.scoreUpdateCallback(currentScore, reflections, refractions, internalReflections, this.currentLevelIndex + 1);
        }

        if (isWin && !this.endGAme) {
            this.endGAme = true;

            // 1. Primeiro atualizamos o score da fase atual no array
            this.levelScores[this.currentLevelIndex] = Math.max(this.levelScores[this.currentLevelIndex], currentScore);

            // 2. Calculamos se devemos desbloquear a próxima fase
            // Se o nível atual + 1 for maior ou igual ao que já temos liberado, liberamos o próximo
            if (this.currentLevelIndex + 1 >= this.unlockedLevels && this.unlockedLevels < 12) {
                this.unlockedLevels = this.currentLevelIndex + 2;
            }

            // 3. AGORA salvamos tudo no localStorage com os valores já atualizados!
            localStorage.setItem('snell_laser_scores', JSON.stringify(this.levelScores));
            localStorage.setItem('snell_laser_unlocked', this.unlockedLevels.toString());

            if (this.endGameCallback) {
                this.endGameCallback(true);
            }
        }
        else if (!isWin && this.endGAme) {
            this.endGAme = false;
            if (this.endGameCallback) {
                this.endGameCallback(false);
            }
        }
    }

    // Dados de nível podem ser acessados por currentLevelData


    private startMusic() {
        //TODO: [X]: Setup the music soundtrack:
        //https://pixabay.com/music/video-games-8-bit-arcade-mode-158814/
        //Music by Dimitrios Gkorilas from Pixabay
        this.backgroundMusic = new SoundModel(
            "backgroundSound",
            "./assets/sounds/hitslab-game-gaming-video-game-music-459876.mp3",
            true
        );
        this.backgroundMusic.setVolume(1.0);
        this.allSounds.push(this.backgroundMusic);
    }

    public triggerRecalculation(): void {
        this.needsRecalculation = true;
    }

    private updateSceneModels() {
        this.scene.onBeforeRenderObservable.add(() => {
            const dt = this.scene.getEngine().getDeltaTime() / 1000;
            if (this.needsRecalculation) {
                this.needsRecalculation = false;
                this.recalcTimer = 0;
            }
        });
    }


    public toggleMusicPlayback(): void {
        if (this.backgroundMusic) {
            this.backgroundMusic.togglePlayback();
        }
    }

    public isMusicEnabled(): boolean {
        return SoundModel.isMusicEnabled;
    }

    public pauseMusic(): void {
        this.backgroundMusic?.gamePause();
    }

    public resumeMusic(): void {
        this.backgroundMusic?.gameResume();
    }

    public setEndGameCallback(callback: (isVisible: boolean) => void): void {
        this.endGameCallback = callback;
    }

    public resetGame() {
        this.updateModels = false;
        console.log("reset Game");
    }
}

import { Scene } from "@babylonjs/core/scene";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";

export class MaterialFactory {
    // Laser
    public matLaserBody!: StandardMaterial;
    public matLaserEmissive!: StandardMaterial;
    // Espelhos
    public matMirrorBase!: StandardMaterial;
    public matMirrorSelected!: StandardMaterial;
    // Splitter
    public matSplitterBase!: StandardMaterial;
    public matSplitterSelected!: StandardMaterial;
    // Vidro
    public matGlassBase!: StandardMaterial;
    public matGlassSelected!: StandardMaterial;
    // Bloco
    public matBlockBody!: StandardMaterial;
    public matBlockStripe!: StandardMaterial;

    constructor(scene: Scene) {
        this.initMaterials(scene);
    }

    private initMaterials(scene: Scene) {
        // Helper para criar materiais básicos
        const createMat = (name: string, diff: Color3, emissive: Color3, alpha: number = 1) => {
            const m = new StandardMaterial(name, scene);
            m.diffuseColor = diff;
            m.emissiveColor = emissive;
            m.alpha = alpha;
            if (alpha < 1) m.backFaceCulling = false;
            m.freeze(); // Otimização de performance
            return m;
        };

        // Laser
        this.matLaserBody = createMat("matLaserBody", new Color3(0.12, 0.12, 0.18), new Color3(0.25, 0.04, 0.04));
        this.matLaserEmissive = createMat("matLaserEmissive", new Color3(0.85, 0.12, 0.12), new Color3(0.85, 0.12, 0.12));

        // Espelhos
        this.matMirrorBase = createMat("matMirrorBase", new Color3(0.78, 0.92, 1), new Color3(0.15, 0.25, 0.45));
        this.matMirrorSelected = createMat("matMirrorSelected", new Color3(0.78, 0.92, 1), new Color3(1, 0.75, 0.05));

        // Splitter
        this.matSplitterBase = createMat("matSplitterBase", new Color3(1, 0.88, 0.4), new Color3(0.3, 0.22, 0.04), 0.68);
        this.matSplitterSelected = createMat("matSplitterSelected", new Color3(1, 0.88, 0.4), new Color3(1, 0.75, 0.05), 0.68);

        // Vidro
        this.matGlassBase = createMat("matGlassBase", new Color3(0.35, 0.72, 1), new Color3(0.04, 0.18, 0.42), 0.48);
        this.matGlassSelected = createMat("matGlassSelected", new Color3(0.35, 0.72, 1), new Color3(0.08, 0.4, 0.8), 0.48);

        // Bloco
        this.matBlockBody = createMat("matBlockBody", new Color3(0.2, 0.2, 0.25), new Color3(0.05, 0.05, 0.08));
        this.matBlockStripe = createMat("matBlockStripe", new Color3(0.6, 0.1, 0.1), new Color3(0.6, 0.1, 0.1));
    }
}
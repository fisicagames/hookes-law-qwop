import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
export interface IView {
    onButtonMenuStartA(callback: () => void): void;
    onButtonMenuStartB(callback: () => void): void;
    onButtonMenuStartC(callback: () => void): void;
    onButtonMenu(callback: () => void): void;
    onButtonMenuContinuar(callback: () => void): void;
    onToggleMusic(callback: () => void): void;
    setMusicIcon(isEnabled: boolean): void; 
    onButtonLang(callback: () => void): void;

    // --- Novos métodos para a Seleção de Fases ---
    onLevelSelect(callback: (levelIndex: number) => void): void;
    updateLevelButtons(unlockedLevels: number, scores: number[]): void;
    hideLevelSelectionPanel(): void;
    showLevelSelectionPanel(): void; 
    updateTotalBestScore(totalScore: number): void;
    updateBestQWOPStats(bestDist: number, bestVel: number): void;
    onButtonResetProgress(callback: () => void): void;
    // ---------------------------------------------

    setButtonUpUpCallback(callback: () => void): void;
    buttonDownUp(callback: () => void): void;
    buttonRightUp(callback: () => void): void;
    buttonLeftUp(callback: () => void): void;
    
    buttonUpDown(callback: () => void): void;
    buttonDownDown(callback: () => void): void;
    buttonRightDown(callback: () => void): void;
    buttonLeftDown(callback: () => void): void;

    onButtonEfeitoIntenso(callback: () => void): void;
    onButtonEfeitoSuave(callback: () => void): void;
    
    updateMainMenuVisibility(isVisible: boolean): void;
    hideMenuPanel(): void;
    showMenuButton(): void;
    getCurrentLanguage(): number;
    onLanguageChange(listener: (lang: number) => void): void;
    changeLanguage(): void;

    updateScoreText(score: number, reflections: number, refractions: number, internalReflections: number, currentLevel: number): void;
    showEndGamePanel(isVisible: boolean): void;
    changeButtonUPSymbol(string: string, coins: number): void;
}
export interface IModel {
    toggleMusicPlayback(): void;
    isMusicEnabled(): boolean;
    pauseMusic(): void;
    resumeMusic(): void;
    // Assinatura garantindo os 4 parâmetros
    setScoreUpdateCallback(callback: (score: number, reflections: number, refractions: number, internalReflections: number, currentLevel: number) => void): void;
    updateGameState(isWin: boolean, reflections: number, refractions: number, internalReflections: number): void;

    setEndGameCallback(callback: (isVisible: boolean) => void): void;
    resetGame(): void;
    updateModels: boolean;

    triggerRecalculation(): void;

    getUnlockedLevels(): number;
    getLevelScores(): number[];
    loadLevel(levelIndex: number): Promise<void>;
    getTotalBestScore(): number;

    resetProgress(): void;

}
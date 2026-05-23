import { Scene } from "@babylonjs/core/scene";
import { KeyboardEventTypes } from "@babylonjs/core/Events/keyboardEvents";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";

import { IModel } from "../Model/IModel";
import { IView } from "../View/IView";
import { InputKeyboardController } from "./InputKeyboardController";
import { QWOPGame } from "../../Game/QWOPGame";

type InteractableElement = {
    root: TransformNode;
    rotationY: number;
    setHighlight(isHighlighted: boolean): void;
};

export class Controller {
    private scene: Scene;
    private model: IModel;
    private view: IView;
    private inputKeyboardControllers: InputKeyboardController;
    private physicsPlugin: HavokPlugin | null;
    private qwopGame: QWOPGame | null = null;

    private activeElementIndex: number = 0;

    // Flags para controle contínuo de rotação via botões GUI (Touch)
    private isLeftPressed: boolean = false;
    private isRightPressed: boolean = false;

    constructor(scene: Scene, model: IModel, view: IView, physicsPlugin?: HavokPlugin | null) {
        this.scene = scene;
        this.model = model;
        this.view = view;
        this.physicsPlugin = physicsPlugin || null;

        this.inputKeyboardControllers = new InputKeyboardController(scene);
        this.inputKeyboardControllerSetup();
        this.inputTouchControllerSetup();

        this.model.setScoreUpdateCallback((score: number, reflections: number, refractions: number, internalReflections: number, currentLevel: number) => {
            this.view.updateScoreText(score, reflections, refractions, internalReflections, currentLevel);
        });

        const totalAcumulado = this.model.getTotalBestScore();
        this.view.updateTotalBestScore(totalAcumulado);



        // Quando o jogador vence o nível (atinge todos os alvos)
        this.model.setEndGameCallback((isVisible: boolean) => {
            this.view.showEndGamePanel(isVisible);
            if (isVisible) {
                this.view.updateTotalBestScore(this.model.getTotalBestScore());
            }
        });

        this.highlightActiveElement();

        // Inicia o loop contínuo de checagens (câmera suave e rotação contínua)
        this.update();

        this.view.setMusicIcon(this.model.isMusicEnabled());

        this.view.onLanguageChange(lang => this.qwopGame?.setLanguage(lang));
    }

    private getInteractables(): InteractableElement[] {
        // Módulos de objetos foram removidos; não há elementos interativos por padrão.
        return [];
    }

    // ══════════════════════════════════════════════════════════════════════
    //  CONTROLES DE TECLADO (PC)
    // ══════════════════════════════════════════════════════════════════════
    private inputKeyboardControllerSetup() {
        this.inputKeyboardControllers.bindKeyboardEvents({
            "arrowup": (eventType) => { this.handleKeyboardSelection(eventType, 1); },
            "arrowdown": (eventType) => { this.handleKeyboardSelection(eventType, -1); },
            "w": (eventType) => { this.handleKeyboardSelection(eventType, 1); },
            "s": (eventType) => { this.handleKeyboardSelection(eventType, -1); },

            "arrowleft": (eventType) => { this.handleKeyboardRotation(eventType, -1); },
            "arrowright": (eventType) => { this.handleKeyboardRotation(eventType, 1); },
            "a": (eventType) => { this.handleKeyboardRotation(eventType, -1); },
            "d": (eventType) => { this.handleKeyboardRotation(eventType, 1); },
        });
    }

    private handleKeyboardSelection(eventType: KeyboardEventTypes, direction: number) {
        if (eventType === KeyboardEventTypes.KEYDOWN) {
            this.handleSelectionTap(direction);
        }
    }

    private handleKeyboardRotation(eventType: KeyboardEventTypes, direction: number) {
        if (eventType === KeyboardEventTypes.KEYDOWN) {
            const interactables = this.getInteractables();
            if (interactables.length > 0) {
                const active = interactables[this.activeElementIndex];
                active.rotationY += direction * 0.024;
                this.model.triggerRecalculation();
            }
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  LÓGICA CENTRAL DE AÇÕES (Usada pelo PC e Mobile)
    // ══════════════════════════════════════════════════════════════════════
    private handleSelectionTap(direction: number) {
        const interactables = this.getInteractables();
        if (interactables.length === 0) return;

        // Desmarca atual
        interactables[this.activeElementIndex].setHighlight(false);

        // Pula pro próximo com loop
        const total = interactables.length;
        this.activeElementIndex = (this.activeElementIndex + direction + total) % total;

        // Destaca novo alvo
        this.highlightActiveElement();
    }

    private highlightActiveElement() {
        const interactables = this.getInteractables();
        if (interactables.length > 0) {
            interactables[this.activeElementIndex].setHighlight(true);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  ATUALIZAÇÃO POR FRAME (LOOP)
    // ══════════════════════════════════════════════════════════════════════
    private update() {
        this.scene.onBeforeRenderObservable.add(() => {
            this.updateCameraPosition();
            this.handleContinuousTouchRotation(); // Verifica os botões GUI sendo segurados
        });
    }

    private handleContinuousTouchRotation() {
        if (this.isLeftPressed || this.isRightPressed) {
            const interactables = this.getInteractables();
            if (interactables.length > 0) {
                const active = interactables[this.activeElementIndex];

                // Determina o sentido do giro com base em qual botão está sendo segurado
                const direction = this.isLeftPressed ? 1 : -1;

                active.rotationY += direction * 0.012;
                this.model.triggerRecalculation();
            }
        }
    }

    private updateCameraPosition(): void {
        // Cena limpa não precisa de ajustes dinâmicos de câmera para os módulos removidos.
    }

    // ══════════════════════════════════════════════════════════════════════
    //  MÉTODOS DE UI E FLUXO DO JOGO
    // ══════════════════════════════════════════════════════════════════════
    private inputTouchControllerSetup() {
        // --- CONTROLES DE JOGO (Mobile GUI) ---

        // SELEÇÃO: Apenas 1 pulo por toque
        this.view.buttonUpDown(() => this.handleSelectionTap(1));
        this.view.buttonDownDown(() => this.handleSelectionTap(-1));

        // ROTAÇÃO: Modifica as flags para girar continuamente no loop de update
        this.view.buttonLeftDown(() => { this.isLeftPressed = true; });
        this.view.buttonLeftUp(() => { this.isLeftPressed = false; });

        this.view.buttonRightDown(() => { this.isRightPressed = true; });
        this.view.buttonRightUp(() => { this.isRightPressed = false; });

        // --- MENUS ---
        this.view.onButtonMenuStartA(() => {
            this.view.hideMenuPanel();
            this.launchQWOPGame();
        });

        this.view.onLevelSelect((_levelIndex: number) => {
            this.startGame(0);
        });

        this.view.onButtonMenuStartB(() => {
            this.view.hideMenuPanel();
            this.launchQWOPGame();
        });
        this.view.onButtonMenuStartC(() => {
            this.view.hideMenuPanel();
            this.launchQWOPGame();
        });
        this.view.onButtonMenuContinuar(() => this.showLevelSelectionPanel());

        this.view.onButtonMenu(() => this.showMenu());

        this.view.onToggleMusic(() => {
            this.model.toggleMusicPlayback(); // Inverte no Model
            const actualState = this.model.isMusicEnabled(); // Pega o estado real
            this.view.setMusicIcon(actualState); // Atualiza a View com a verdade
        });

        this.view.onButtonLang(() => this.changeLanguage());

        this.view.onButtonResetProgress(() => {
            // Opcional: Adicionar um confirm nativo do navegador para segurança
            //const confirmText = this.view.advancedTexture.getControlByName("ButtonLang")?.metadata === 0 ?
            //    "Deseja apagar todo o progresso?" : "Reset all progress?";

            this.model.resetProgress();

            // Atualiza a interface imediatamente após o reset
            this.view.updateTotalBestScore(this.model.getTotalBestScore());
            this.view.updateLevelButtons(this.model.getUnlockedLevels(), this.model.getLevelScores());
        });
    }

    private startGame(_levelIndex: number): void {
        // ✨ LIMPEZA: Carregamento automático desabilitado - cena começa vazia
        // Descomente a linha abaixo para carregar o nível ao selecionar uma fase
        // this.model.loadLevel(_levelIndex);
        this.view.hideLevelSelectionPanel();
        this.continueGame();

        this.activeElementIndex = 0;
        this.highlightActiveElement();
    }

    private showLevelSelectionPanel() {
        // 1. Busca e envia a pontuação total somada para a View
        this.view.updateTotalBestScore(this.model.getTotalBestScore());

        // 2. Atualiza os botões (cadeados e pontos individuais)
        this.view.updateLevelButtons(this.model.getUnlockedLevels(), this.model.getLevelScores());

        // 3. Mostra o painel
        this.view.showLevelSelectionPanel();
    }

    private continueGame() {
        this.view.updateMainMenuVisibility(false);
        this.view.showEndGamePanel(false);
    }

    private showMenu(): void {
        if (this.qwopGame) {
            this.view.updateBestQWOPStats(this.qwopGame.getBestDist(), this.qwopGame.getBestVel());
            this.qwopGame.dispose();
            this.qwopGame = null;
        }
        this.model.resumeMusic();
        this.view.updateMainMenuVisibility(true);
    }

    private toggleMusic(): void {
        this.model.toggleMusicPlayback();
    }

    private changeLanguage(): void {
        this.view.changeLanguage();
    }

    private async launchQWOPGame(): Promise<void> {
        if (this.qwopGame) return; // já iniciado
        this.qwopGame = new QWOPGame(this.scene);
        await this.qwopGame.start();
        this.qwopGame.setLanguage(this.view.getCurrentLanguage());
        this.qwopGame.setOnGameOver(() => this.model.pauseMusic());
        this.qwopGame.setOnGameResume(() => this.model.resumeMusic());
        this.view.showMenuButton();
    }
}
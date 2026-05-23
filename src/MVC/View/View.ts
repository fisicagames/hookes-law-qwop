// src\View\View.ts
import { Scene } from "@babylonjs/core/scene";

import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Grid } from "@babylonjs/gui/2D/controls/grid";
import { Control } from "@babylonjs/gui/2D/controls/control";

import { IView } from "./IView";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { EndGamePhrases } from "./EndGamePhrases";
import { PhysicsConceptualPhrases } from "./PhysicsConceptualPhrases";
import { LanguageDetector } from "./LanguageDetector";
import { translate } from "./translate";

export class View implements IView {
    private lastTotalScore: number = 0;
    private scene: Scene;
    public advancedTexture: AdvancedDynamicTexture;
    private rectangleMenu!: Rectangle;
    private buttonMenuStartA!: Button;
    private buttonMenuStartB!: Button;
    private buttonMenuStartC!: Button;
    private buttonMenuContinuar!: Button;
    private buttonMenu!: Button;
    private textblockLevel!: TextBlock;
    private rectangleTouch!: Rectangle;
    private rectangleTop!: Rectangle;
    public textblockMenuMusic!: TextBlock;
    private buttonLang!: Button;
    private languageSwitcher: LanguageSwitcher;
    private buttonUp!: Button;
    private buttonDown!: Button;
    private buttonRight!: Button;
    private buttonLeft!: Button;
    private rectangleGame!: Rectangle;
    private textblockMenuBest!: TextBlock;
    private textblockTotalScore!: TextBlock;
    private topScore: number = 0;
    private textblockScoreGame!: TextBlock;
    private textblockCenterPhrase!: TextBlock;
    private rectangleCenterPhrase!: Rectangle;
    private textblockSecond!: TextBlock;
    private rectangleAviso!: Rectangle;
    private rectangleFases!: Rectangle;
    private textblockAviso!: TextBlock;
    private buttonEfeitoSuave!: Button;
    private buttonEfeitoIntenso!: Button;
    private buttonMenuPlay!: Button;
    private firstTime: boolean = true;
    private languageChangeListeners: ((lang: number) => void)[] = [];
    private textblockMenuLevel!: TextBlock;
    private textblockGraph!: TextBlock;
    private buttonResetProgress!: Button;


    // Elementos do Grid de Fases
    private levelButtons: Button[] = [];
    private levelScoreTexts: TextBlock[] = [];
    private onLevelSelectCallback: ((levelIndex: number) => void) | null = null;

    constructor(scene: Scene, advancedTexture: AdvancedDynamicTexture) {
        this.scene = scene;
        this.advancedTexture = advancedTexture;
        this.languageSwitcher = new LanguageSwitcher();
        this.initializeGUI();
        LanguageDetector.detectAndSetLanguage(() => this.changeLanguage());
    }

    public onLanguageChange(listener: (lang: number) => void): void {
        this.languageChangeListeners.push(listener);
    }

    public changeLanguage(): void {
        this.languageSwitcher.changeLanguage(this.advancedTexture);
        const lang = this.languageSwitcher.getCurrentLanguage();
        this.languageChangeListeners.forEach(fn => fn(lang));
        this.getBestScoreDisplay(this.lastTotalScore);
    }

    private initializeGUI() {
        this.buttonMenuStartA = this.advancedTexture.getControlByName("ButtonMenuStartA") as Button;
        this.buttonMenuStartB = this.advancedTexture.getControlByName("ButtonMenuStartB") as Button;
        this.buttonMenuStartC = this.advancedTexture.getControlByName("ButtonMenuStartC") as Button;
        this.buttonMenu = this.advancedTexture.getControlByName("ButtonMenu") as Button;
        this.buttonMenu.isVisible = false;
        this.buttonMenuContinuar = this.advancedTexture.getControlByName("ButtonMenuContinuar") as Button;
        this.rectangleMenu = this.advancedTexture.getControlByName("RectangleMenu") as Rectangle;
        this.rectangleMenu.isVisible = true;
        this.textblockLevel = this.advancedTexture.getControlByName("TextblockLevel") as TextBlock;
        this.textblockLevel.isVisible = false;
        this.rectangleTouch = this.advancedTexture.getControlByName("RectangleTouch") as Rectangle;
        this.rectangleTouch.isVisible = false;
        this.rectangleTop = this.advancedTexture.getControlByName("RectangleTop") as Rectangle;
        this.rectangleTop.isVisible = false;
        this.textblockMenuMusic = this.advancedTexture.getControlByName("TextblockMenuMusic") as TextBlock;
        this.buttonLang = this.advancedTexture.getControlByName("ButtonLang") as Button;
        this.buttonUp = this.advancedTexture.getControlByName("ButtonUp") as Button;
        this.buttonDown = this.advancedTexture.getControlByName("ButtonDown") as Button;
        this.buttonLeft = this.advancedTexture.getControlByName("ButtonRight") as Button;
        this.buttonRight = this.advancedTexture.getControlByName("ButtonLeft") as Button;
        this.rectangleGame = this.advancedTexture.getControlByName("RectangleGame") as Rectangle;
        this.rectangleGame.isVisible = false;
        this.textblockMenuBest = this.advancedTexture.getControlByName("TextblockMenuBest") as TextBlock;
        this.textblockTotalScore = this.advancedTexture.getControlByName("TextblockTotalScore") as TextBlock;
        this.textblockScoreGame = this.advancedTexture.getControlByName("TextblockScoreGame") as TextBlock;
        this.textblockCenterPhrase = this.advancedTexture.getControlByName("TextblockCenterPhrase") as TextBlock;
        this.rectangleCenterPhrase = this.advancedTexture.getControlByName("RectangleCenterPhrase") as Rectangle;
        this.rectangleCenterPhrase.isVisible = false;
        this.rectangleGame = this.advancedTexture.getControlByName("RectangleGame") as Rectangle;
        this.textblockSecond = this.advancedTexture.getControlByName("TextblockSecond") as TextBlock;
        this.rectangleAviso = this.advancedTexture.getControlByName("RectangleAviso") as Rectangle;
        this.rectangleFases = this.advancedTexture.getControlByName("RectangleFases") as Rectangle;
        this.textblockAviso = this.advancedTexture.getControlByName("TextblockAviso") as TextBlock;
        this.buttonEfeitoSuave = this.advancedTexture.getControlByName("ButtonEfeitoSuave") as Button;
        this.buttonEfeitoIntenso = this.advancedTexture.getControlByName("ButtonEfeitoIntenso") as Button;
        this.rectangleAviso.isVisible = false;
        this.buttonMenuPlay = this.advancedTexture.getControlByName("ButtonMenuPlay") as Button;
        this.textblockMenuLevel = this.advancedTexture.getControlByName("TextblockMenuLevel") as TextBlock;
        this.textblockGraph = this.advancedTexture.getControlByName("TextblockGraph") as TextBlock;

        this.buttonMenuPlay.onPointerUpObservable.add(() => {
            this.rectangleAviso.isVisible = false;
        });

        this.setupLevelGrid();

        this.createResetButton();
    }

    private createResetButton() {
        this.buttonResetProgress = Button.CreateSimpleButton("ButtonResetProgress", "Zerar Progresso");
        this.buttonResetProgress.width = "180px";
        this.buttonResetProgress.height = "35px";
        this.buttonResetProgress.color = "white";
        this.buttonResetProgress.background = "#d9534f"; // Vermelho para alerta
        this.buttonResetProgress.cornerRadius = 5;
        this.buttonResetProgress.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.buttonResetProgress.top = "-15px"; // Distância do fundo

        // Adiciona ao painel principal de avisos
        this.rectangleAviso.addControl(this.buttonResetProgress);
    }

    public onButtonResetProgress(callback: () => void): void {
        this.buttonResetProgress.onPointerUpObservable.add(callback);
    }


    public updateBestQWOPStats(bestDist: number, bestVel: number): void {
        const isPT = this.languageSwitcher.languageOption === 0;
        const distLabel = isPT ? "Dist. máx" : "Max dist.";
        const velLabel  = isPT ? "Vel. máx"  : "Max vel.";
        const fmtNum = (n: number) => isPT ? n.toFixed(1).replace('.', ',') : n.toFixed(1);
        const text = `${distLabel}: ${fmtNum(bestDist)} m\n${velLabel}: ${fmtNum(bestVel)} m/s`;
        this.textblockMenuBest.text = text;
        if (this.textblockAviso) {
            this.textblockAviso.text = text;
        }
    }

    public updateTotalBestScore(_totalScore: number): void {
        const savedDist = parseFloat(localStorage.getItem('qwop_best_dist') ?? '0');
        const savedVel  = parseFloat(localStorage.getItem('qwop_best_vel')  ?? '0');
        this.updateBestQWOPStats(savedDist, savedVel);
    }

    private setupLevelGrid() {
        if (!this.rectangleFases) return; // Segurança caso o nome no JSON esteja diferente

        const grid = new Grid();
        // 3 Colunas iguais
        grid.addColumnDefinition(1.0, false);
        grid.addColumnDefinition(1.0, false);
        grid.addColumnDefinition(1.0, false);
        // 4 Linhas iguais
        grid.addRowDefinition(1.0, false);
        grid.addRowDefinition(1.0, false);
        grid.addRowDefinition(1.0, false);
        grid.addRowDefinition(1.0, false);

        this.rectangleFases.addControl(grid);

        // Criar 12 botões
        for (let i = 0; i < 12; i++) {
            const btn = new Button("btnLevel" + i);
            btn.paddingTop = "5px";
            btn.paddingBottom = "5px";
            btn.paddingLeft = "5px";
            btn.paddingRight = "5px";
            btn.cornerRadius = 8;
            btn.thickness = 2;

            // Criar um Grid interno no botão para dividir entre Número (cima) e Score (baixo)
            const innerGrid = new Grid();
            innerGrid.addRowDefinition(0.6, false); // 60% altura pro número
            innerGrid.addRowDefinition(0.4, false); // 40% altura pra pontuação

            const txtNum = new TextBlock("txtNum" + i, (i + 1).toString());
            txtNum.fontSize = 24;
            txtNum.color = "white";
            txtNum.fontWeight = "bold";

            const txtScore = new TextBlock("txtScore" + i, "0 pts");
            txtScore.fontSize = 12;
            txtScore.color = "#00E5FFFF";

            innerGrid.addControl(txtNum, 0, 0);
            innerGrid.addControl(txtScore, 1, 0);
            btn.addControl(innerGrid);

            // Adiciona no Grid Principal
            const row = Math.floor(i / 3);
            const col = i % 3;
            grid.addControl(btn, row, col);

            // Salva na lista para podermos atualizar (bloquear/desbloquear) depois
            this.levelButtons.push(btn);
            this.levelScoreTexts.push(txtScore);

            // Ação de Clique
            btn.onPointerUpObservable.add(() => {
                if (btn.isEnabled && this.onLevelSelectCallback) {
                    this.onLevelSelectCallback(i);
                }
            });
        }
    }

    // --- MÉTODOS DE CONTROLE DA GRADE DE FASES ---
    public onLevelSelect(callback: (levelIndex: number) => void): void {
        this.onLevelSelectCallback = callback;
    }

    public updateLevelButtons(unlockedLevels: number, scores: number[]): void {
        for (let i = 0; i < 12; i++) {
            if (i < unlockedLevels) {
                // Fase Liberada
                this.levelButtons[i].isEnabled = true;
                this.levelButtons[i].background = "#0055aa"; // Azul mais vivo
                this.levelButtons[i].alpha = 1.0;
            } else {
                // Fase Bloqueada
                this.levelButtons[i].isEnabled = false;
                this.levelButtons[i].background = "#223344"; // Cinza/Azul escuro
                this.levelButtons[i].alpha = 0.5;
            }
            this.levelScoreTexts[i].text = (scores[i] || 0) + " pts";
        }
    }

    public hideLevelSelectionPanel(): void {
        this.rectangleAviso.isVisible = false;
    }
    public showLevelSelectionPanel(): void {
        this.rectangleAviso.isVisible = true;
    }

    public hideMenuPanel(): void {
        this.rectangleMenu.isVisible = false;
    }

    public showMenuButton(): void {
        this.buttonMenu.isVisible = true;
    }

    public getCurrentLanguage(): number {
        return this.languageSwitcher.getCurrentLanguage();
    }

    public updateMainMenuVisibility(isVisible: boolean) {
        this.rectangleMenu.isVisible = isVisible;
        this.buttonMenu.isVisible = !isVisible;
        this.textblockLevel.isVisible = !isVisible;
        this.rectangleTouch.isVisible = !isVisible;
        this.rectangleTop.isVisible = !isVisible;
        this.rectangleGame.isVisible = !isVisible;
        this.rectangleCenterPhrase.isVisible = !isVisible;
    }

    public onButtonEfeitoSuave(callback: () => void) {
        this.buttonEfeitoSuave.onPointerUpObservable.add(() => {
            callback();
        });
    };
    public onButtonEfeitoIntenso(callback: () => void) {
        this.buttonEfeitoIntenso.onPointerUpObservable.add(() => {
            callback();
        });
    };


    public onButtonMenuStartA(callback: () => void): void {
        this.buttonMenuStartA.onPointerUpObservable.add(() => {
            callback();
        });
    }

    public onButtonMenuStartB(callback: () => void): void {
        this.buttonMenuStartB.onPointerUpObservable.add(() => {
            callback();
        });
    }
    public onButtonMenuStartC(callback: () => void): void {
        this.buttonMenuStartC.onPointerUpObservable.add(callback);
    }
    public onButtonMenuContinuar(callback: () => void): void {
        this.buttonMenuContinuar.onPointerUpObservable.add(callback);
    }
    public onButtonMenu(callback: () => void): void {
        this.buttonMenu.onPointerUpObservable.add(callback);
    }

    public onToggleMusic(callback: () => void): void {
        this.textblockMenuMusic.onPointerUpObservable.add(() => {
            callback(); // Chama o callback passado
        });
    }

    public onButtonLang(callback: () => void): void {
        this.buttonLang.onPointerUpObservable.add(callback);
    }

    public setMusicIcon(isEnabled: boolean): void {
        this.textblockMenuMusic.text = isEnabled ? "🔊" : "🔈";
    }

    public setButtonUpUpCallback(callback: () => void): void {
        this.buttonUp.onPointerUpObservable.add(callback);
    }
    public buttonDownUp(callback: () => void): void {
        this.buttonDown.onPointerUpObservable.add(callback);
    }
    public buttonRightUp(callback: () => void): void {
        this.buttonRight.onPointerUpObservable.add(callback);
    }
    public buttonLeftUp(callback: () => void): void {
        this.buttonLeft.onPointerUpObservable.add(callback);
    }
    public buttonUpDown(callback: () => void): void {
        this.buttonUp.onPointerDownObservable.add(callback);
    }
    public buttonDownDown(callback: () => void): void {
        this.buttonDown.onPointerDownObservable.add(callback);
    }
    public buttonRightDown(callback: () => void): void {
        this.buttonRight.onPointerDownObservable.add(callback);
    }
    public buttonLeftDown(callback: () => void): void {
        this.buttonLeft.onPointerDownObservable.add(callback);
    }

    public updateScoreText(score: number, reflections: number, refractions: number, internalReflections: number, currentLevel: number): void {
        if (this.languageSwitcher.languageOption == 0) { // Português
            this.textblockLevel.text = `Nível: ${currentLevel} | Reflexões: ${reflections} | Refrações: ${refractions} \n Reflexões Internas Totais: ${internalReflections}\n Pontos: ${score} ⭐`;
        } else { // Inglês
            this.textblockLevel.text = `Level: ${currentLevel} | Reflections: ${reflections} | Refractions: ${refractions} \n Total Internal Reflections: ${internalReflections}\n Score: ${score} ⭐`;
        }

        // Atualiza o recorde do nível atual se aplicável
        if (this.topScore < score) {
            this.topScore = score;
            if (this.topScore > 3) {
                this.getBestScoreDisplay(score);
            }
        }
    }

    private getScoreDisplay(score: number): string {
        if (score < 500) {
            return `${score.toFixed(0)} J`;
        } else if (score < 600) {
            return `${score.toFixed(0)} J 🥉`;
        } else if (score < 700) {
            return `${score.toFixed(0)} J 🥈`;
        } else {
            return `${score.toFixed(0)} J 🥇`;
        }
    }


    private getBestScoreDisplay(score: number) {
        if (!this.textblockMenuLevel) return;

        const isPT = this.languageSwitcher.languageOption === 0;

        if (score < 200) {
            this.textblockMenuLevel.text = isPT ? "Iniciante 🐣" : "Beginner 🐣";
        } else if (score < 400) {
            this.textblockMenuLevel.text = isPT ? "Estudante Curioso 🧐" : "Curious Student 🧐";
        } else if (score < 600) {
            this.textblockMenuLevel.text = isPT ? "Estudante Aplicado 📘" : "Dedicated Student 📘";
        } else if (score < 800) {
            this.textblockMenuLevel.text = isPT ? "Universitário Iniciante ✏️" : "Novice University Student ✏️";
        } else if (score < 1000) {
            this.textblockMenuLevel.text = isPT ? "Universitário Dedicado 📚" : "Advanced University Student 📚";
        } else if (score < 1500) {
            this.textblockMenuLevel.text = isPT ? "Professor de Física 🧑‍🏫" : "Physics Professor 🧑‍🏫";
        } else if (score < 2000) {
            this.textblockMenuLevel.text = isPT ? "Professor de Óptica 🎓" : "Optics Professor 🎓";
        } else if (score < 2500) {
            this.textblockMenuLevel.text = isPT ? "Gênio da Física 🧠" : "Physics Genius 🧠";
        } else {
            this.textblockMenuLevel.text = isPT ? "Willebrord Snellius ✨" : "Willebrord Snellius ✨";
        }
    }


    public showEndGamePanel(isVisible: boolean): void {
        this.rectangleGame.isVisible = isVisible;
        if (isVisible && !this.rectangleCenterPhrase.isVisible) {
            this.rectangleCenterPhrase.isVisible = isVisible;
            this.textblockCenterPhrase.text = PhysicsConceptualPhrases.getRandomOpticPhrase(this.languageSwitcher.languageOption);
        }
        else {
            this.rectangleCenterPhrase.isVisible = isVisible;
        }
    }
    public changeButtonUPSymbol(string: string, coins: number) {
        if (!this.buttonUp.textBlock) {
            console.warn(`[WARNING]: buttonUp.textBlock is null or undefined.`);
            return;
        }

        let translatedText: string;

        if (string == "0") {
            translatedText = translate("Fonte Quente", this.languageSwitcher.languageOption);
        }
        else if (string == "1") {
            translatedText = translate("Isolante", this.languageSwitcher.languageOption);
        }
        else {
            translatedText = translate("Fonte Fria", this.languageSwitcher.languageOption);
        }
        this.buttonUp.textBlock.text = `${translatedText} (${coins})`;
    }
}
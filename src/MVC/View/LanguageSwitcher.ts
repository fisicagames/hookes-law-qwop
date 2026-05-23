import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Button } from "@babylonjs/gui/2D/controls/button";

export class LanguageSwitcher {
    public languageOption: number;
    private strings: Record<string, string[]>;

    constructor() {
        this.languageOption = 0;
        this.strings = {
            ButtonLang: ["ENGLISH", "PORTUGUÊS"],
            TextblockMeta: ["Objetivo: use os botões QWOP para controlar os pés e mover a mesa. Colete as chaves para desbloquear ajustes do sistema massa-mola e ir mais longe e mais rápido possível. Atenção: jogos do gênero QWOP costumam ser muito difíceis!", "Objective: use the QWOP buttons to control the feet and move the table. Collect the keys to unlock mass-spring system adjustments and go further and faster as possible. Warning: QWOP-like games are usually very difficult!"],
            TextblockTitle: ["Hooke's Law QWOP", "Hooke's Law QWOP"], 
            ButtonMenuStartA: ["Iniciar", "Start"],
            ButtonMenuStartB: ["Movimento Linear", "Linear Motion"],
            ButtonMenuStartC: ["None", "None"],
            TextblockMenuScore: ["Melhor resultado:",  "High Score:"],
            TextBlockFirst: ["Lei de Snell-Descartes", "Snell-Descartes Law"],
            TextblockSecond: ["n₁ sen(θ₁) = n₂ sen(θ₂)", "n₁ sin(θ₁) = n₂ sin(θ₂)"],
            TextBlockThird: ["n₁ e n₂: índices de refração do meio 1 e meio 2.", "n₁ and n₂: refractive indices of medium 1 and 2."],
            TextBlockQuarter: ["θ₁:  ângulo de incidência e θ₂: ângulo de refração.", "θ₁:  angle of incidence and θ₂: angle of refraction."],
            TextBlockFiver: ["dV: Infinitesimal de volume (m³).", "dV: Infinitesimal volume (m³)."],            
            ButtonMenuContinuar: ["Próximo","Next"],
            TextblockScoreGame: ["Você venceu!","You won!"],
            TextblockMusic: ["Música:","Music:"],
            TextblockAviso:  ["Total: 0 pontos","Total: 0 points"],
            ButtonEfeitoSuave: ["Efeito Suave","Soft Effect"],
            ButtonEfeitoIntenso: ["Efeito Intenso","Intense Effect"],
            TextblockGraph: ["Diagrama PxV", "PxV Diagram"],
            ButtonMenuPlay: ["Jogar", "Play"],
            ButtonResetProgress: ["Zerar Progresso", "Reset Progress"]
        };
    }

    public changeLanguage(advancedTexture: AdvancedDynamicTexture): void {
        this.languageOption = this.languageOption === 0 ? 1 : 0;
        this.updateText(advancedTexture);
    }

    public updateText(advancedTexture: AdvancedDynamicTexture): void {
        for (const key in this.strings) {
            if (this.strings.hasOwnProperty(key)) {
                const translations = this.strings[key];
                const control = advancedTexture.getControlByName(key);

                if (control instanceof TextBlock) {
                    control.text = translations[this.languageOption];
                } else if (control instanceof Button && control.textBlock) {
                    control.textBlock.text = translations[this.languageOption];
                }
            }
        }
    }

    public getCurrentLanguage(): number {
        return this.languageOption;
    }

    public getTranslation(key: string): string {
        return this.strings[key][this.languageOption];
    }
}

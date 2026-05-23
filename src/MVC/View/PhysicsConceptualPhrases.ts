export class PhysicsConceptualPhrases {
    public static getRandomOpticPhrase(languageOption: number): string {
        const phrasesPt = [
            "🔁 Lei da reflexão: o ângulo de incidência é igual ao ângulo de reflexão.",
            "📐 Raio incidente, normal e refletido pertencem ao mesmo plano.",
            "🪞 Em espelhos planos, a imagem forma-se à mesma distância do objeto.",
            "✨ Reflexão pode ser especular (lisa) ou difusa (irregular).",
            "🔬 Os ângulos são medidos em relação à normal à superfície.",
            "🌊 Parte da luz pode ser refletida e parte transmitida.",
            "⚖️ A reflexão é reversível: o caminho pode ser invertido.",
            "🔭 Espelhos curvos alteram a convergência dos raios refletidos.",
            "🔗 A reflexão não altera a frequência da luz.",
            
            "🌈 Lei de Snell: n₁·sin(θ₁) = n₂·sin(θ₂).",
            "🔄 Em meio mais refringente, o raio aproxima-se da normal.",
            "⚡ A refração ocorre pela mudança da velocidade da luz.",
            "📉 Na refração, a frequência permanece constante.",
            "📐 O ângulo de refração é medido em relação à normal.",
            "🚿 Pode ocorrer reflexão interna total em certos ângulos.",
            "🔬 Ângulo crítico: sin(θc) = n₂/n₁ (n₁ > n₂).",
            "🌊 Objetos submersos parecem deslocados pela refração.",
            "🔭 A dispersão ocorre pois cada cor refrata diferente.",
            "🧪 Índice de refração: n = c/v.",
            "🔁 Em meios não homogêneos, a luz segue trajetória curva."
        ];

        const phrasesEn = [
            "🔁 Law of reflection: angle of incidence equals angle of reflection.",
            "📐 Incident ray, normal, and reflected ray lie in the same plane.",
            "🪞 In plane mirrors, the image forms at the same distance as the object.",
            "✨ Reflection can be specular (smooth) or diffuse (rough).",
            "🔬 Angles are measured relative to the normal.",
            "🌊 Light can be partially reflected and transmitted.",
            "⚖️ Reflection is reversible: paths can be inverted.",
            "🔭 Curved mirrors change ray convergence.",
            "🔗 Reflection does not change light frequency.",
            
            "🌈 Snell's law: n₁·sin(θ₁) = n₂·sin(θ₂).",
            "🔄 In higher-index media, rays bend toward the normal.",
            "⚡ Refraction occurs due to change in light speed.",
            "📉 In refraction, frequency remains constant.",
            "📐 Refraction angle is measured from the normal.",
            "🚿 Total internal reflection may occur at certain angles.",
            "🔬 Critical angle: sin(θc) = n₂/n₁ (n₁ > n₂).",
            "🌊 Submerged objects appear shifted due to refraction.",
            "🔭 Dispersion occurs because colors refract differently.",
            "🧪 Refractive index: n = c/v.",
            "🔁 In non-uniform media, light follows a curved path."
        ];

        if (languageOption === 1) {
            return phrasesEn[Math.floor(Math.random() * phrasesEn.length)];
        } else {
            return phrasesPt[Math.floor(Math.random() * phrasesPt.length)];
        }
    }
}
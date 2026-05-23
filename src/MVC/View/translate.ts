export function translate(key: string, languageOption: number): string {
    const translations = {
        "": [
            "", // PT
            "" // EN
        ],
        "Volume mínimo! \n Pistão emperrado!\n Fim de jogo!": [
            "Volume mínimo! \n Pistão emperrado!\n Fim de jogo!", // PT
            "Minimum volume! \n Piston jammed!\n Game Over!" // EN
        ],
        "Máquina Congelada! \n Fim de jogo!": [
            "Máquina Congelada! \n Fim de jogo!", // PT
            "Frozen Machine! \n Game Over!" // EN
        ],
        "Máquina fundida!. \n Fim de jogo!": [
            "Máquina fundida!. \n Fim de jogo!", // PT
            "Melted Machine!. \n Game Over!" // EN
        ],
        "Volume máximo! \n Pistão emperrado!\n Fim de jogo!": [
            "Volume máximo! \n Pistão emperrado!\n Fim de jogo!", // PT
            "Maximum volume! \n Piston jammed!\n Game Over!" // EN
        ],
        "Expansão Isotérmica.": [
            "Expansão Isotérmica.", // PT
            "Isothermal Expansion." // EN
        ],
        "Compressão Isotérmica.": [
            "Compressão Isotérmica.", // PT
            "Isothermal Compression." // EN
        ],
        "Expansão Adiabática.": [
            "Expansão Adiabática.", // PT
            "Adiabatic Expansion." // EN
        ],
        "Compressão Adiabática.": [
            "Compressão Adiabática.", // PT
            "Adiabatic Compression." // EN
        ],
        "Expansão não Adiabática.": [
            "Expansão não Adiabática.", // PT
            "Non-Adiabatic Expansion." // EN
        ],
        "Compressão não Adiabática.": [
            "Compressão não Adiabática.", // PT
            "Non-Adiabatic Compression." // EN
        ],
        "Baixa pressão.": [
            "Baixa pressão.", // PT
            "Low pressure." // EN
        ],
        "Estado em Equilíbrio.": [
            "Estado em Equilíbrio.", // PT
            "Equilibrium state." // EN
        ],
        "Máquina parada.": [
            "Máquina parada.", // PT
            "Machine stopped." // EN
        ],
        "Fim de jogo!": [
            "Fim de jogo!", // PT
            "Game Over!" // EN
        ],
        "Fonte Quente": [
            "Fonte Quente", // PT
            "Hot Reservoir" // EN
        ],
        "Isolante": [
            "Isolante", // PT
            "Insulating Stand" // EN
        ],
        "Fonte Fria": [
            "Fonte Fria", // PT
            "Cold Reservoir" // EN
        ]
    };
    if (!translations[key]) {
        console.warn(`Chave não encontrada para: ${key}`);
        return key;
    }
    return translations[key] ? translations[key][languageOption] : key;
}

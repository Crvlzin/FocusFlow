export interface MotivationalQuote {
  quote: string;
  author?: string;
}

export const MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
  {
    quote: `Que a tua vida não seja uma vida estéril. - Sê útil. - Deixa rasto. - Ilumina com o resplendor da tua fé e do teu amor. 
            Apaga, com a tua vida de apóstolo, o rasto viscoso e sujo que deixaram os semeadores impuros do ódio. - E incendeia todos os caminhos da terra com o fogo de Cristo que levas no coração.`,
    author: "São Josemaria Escrivà",
  },
];

/**
 * Retorna uma frase motivacional aleatória da lista
 */
export function getRandomQuote(): MotivationalQuote {
  const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  return MOTIVATIONAL_QUOTES[randomIndex];
}

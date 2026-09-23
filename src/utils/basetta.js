import { mmAPx } from './scala';

export function calcolaDimensioniBasettaPx(template, pxPerPollice) {
  const px = (mm) => mmAPx(mm, pxPerPollice);

  if (template.forma === 'tonda') {
    const diametro = px(template.diametroMm || 32);
    return { larghezza: diametro, altezza: diametro };
  }

  return {
    larghezza: px(template.larghezzaMm || 32),
    altezza: px(template.lunghezzaMm || 60),
  };
}

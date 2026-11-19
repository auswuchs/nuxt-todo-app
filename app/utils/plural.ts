const pluralRules = new Intl.PluralRules('ru-RU')

const FORM_INDEX: Record<Intl.LDMLPluralRule, number> = {
  zero: 2,
  one: 0,
  two: 1,
  few: 1,
  many: 2,
  other: 1,
}

export function pluralizeRu(
  count: number,
  forms: readonly [one: string, few: string, many: string],
): string {
  const index = FORM_INDEX[pluralRules.select(count)]
  return `${count} ${forms[index] ?? forms[2]}`
}

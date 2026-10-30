/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  rules: {
    'media-feature-range-notation': null,
    'selector-pseudo-class-no-unknown': [
      true,
      { ignorePseudoClasses: ['global'] },
    ],
    'selector-class-pattern': '^([_a-z][a-z0-9]*)(-[a-z0-9]+)*$',
  },
  overrides: [
    // Astro components keep their CSS in <style> blocks.
    { files: ['**/*.astro'], customSyntax: 'postcss-html' },
  ],
};

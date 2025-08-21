const jsdoc = require("eslint-plugin-jsdoc");
const preferArrow = require("eslint-plugin-prefer-arrow");
const js = require("@eslint/js");
const eslint = require("@eslint/js");
const globals = require("globals");
const pluginVue = require("eslint-plugin-vue");
const eslintConfigPrettier = require("eslint-config-prettier");

const baseConfig = {
	files: ["**/*.js", "**/*.vue"], // Specify the files to lint
	ignores: ["**/*.d.ts", "__tests__"], // Specify the files to ignore
	languageOptions: {
		parserOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
		},
		ecmaVersion: 2022,
		sourceType: "module",
		globals: {
			...globals.node,
		},
	},
	plugins: {
		jsdoc,
		preferArrow,
	},
	rules: {
		"vue/no-use-v-if-with-v-for": "off",
		indent: [
			"error",
			"tab",
			{
				SwitchCase: 1,
				ignoredNodes: ["ConditionalExpression"],
			},
		],
		"linebreak-style": ["error", "unix"],
		semi: ["error", "always"],
		"arrow-parens": ["off", "always"],
		"brace-style": ["off", "off"],
		complexity: "off",
		"constructor-super": "error",
		"dot-notation": "off",
		eqeqeq: ["error", "smart"],
		"guard-for-in": "error",
		"id-denylist": [
			"error",
			"any",
			"Number",
			"number",
			"String",
			"string",
			"Boolean",
			"boolean",
			"Undefined",
			"undefined",
		],
		"id-match": "error",
		"jsdoc/check-alignment": "error",
		"jsdoc/check-indentation": "off",
		"max-classes-per-file": ["error", 25],
		"no-array-constructor": "off",
		"no-bitwise": "error",
		"no-caller": "error",
		"no-cond-assign": "error",
		"no-console": "off",
		"no-debugger": "error",
		"no-empty": "error",
		"no-empty-function": "off",
		"no-eval": "error",
		"no-fallthrough": "off",
		"no-implied-eval": "off",
		"no-invalid-this": "off",
		"no-irregular-whitespace": "off",
		"no-loss-of-precision": "off",
		"no-new-wrappers": "error",
		"no-shadow": "off",
		"no-throw-literal": "off",
		"no-undef-init": "error",
		"no-underscore-dangle": "off",
		"no-unsafe-finally": "error",
		"no-unused-expressions": "off",
		"no-unused-labels": "error",
		"no-unused-vars": "off",
		"no-use-before-define": "off",
		"no-var": "error",
		"object-shorthand": "off",
		"one-var": ["error", "never"],
		"padded-blocks": ["off", { blocks: "never" }, { allowSingleLineBlocks: true }],
		"prefer-const": "error",
		"require-await": "off",
		"space-in-parens": ["off", "never"],
		"spaced-comment": ["error", "always", { markers: ["/"] }],
		"use-isnan": "error",
		"valid-typeof": "off",
	},
};

module.exports = [
	{
		...js.configs.recommended,
		...baseConfig,
	},
	{
		...eslint.configs.recommended,
		...baseConfig,
	},
	...pluginVue.configs["flat/vue2-recommended"],
	{ ...baseConfig },
	{ ...eslintConfigPrettier },
];

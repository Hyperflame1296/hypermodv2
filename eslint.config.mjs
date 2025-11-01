import { defineConfig } from 'eslint/config';
import babelParser from '@babel/eslint-parser';
import fs from 'node:fs'
let babelOptions = JSON.parse(fs.readFileSync('.babelrc', 'utf-8'))
export default defineConfig([{
    languageOptions: {
        parser: babelParser,
        ecmaVersion: 2024,
        sourceType: 'module',
        
        parserOptions: {
            requireConfigFile: false,

            babelOptions,
        },
    },
    rules: {},
}]);
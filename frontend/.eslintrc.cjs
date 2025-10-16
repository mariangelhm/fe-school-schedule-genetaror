module.exports = {
  root: true,
  extends: ['standard-with-typescript', 'plugin:react/recommended'],
  parserOptions: {
    project: './tsconfig.json'
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    'react/react-in-jsx-scope': 'off'
  }
}

module.exports = function(wallaby) {
  return {
    files: [
      { pattern: 'src/**/*.js', load: false },
      { pattern: 'tests/**/*.js', load: false },
      { pattern: '!tests/**/*.spec.js' }
    ],
    compilers: {
      '**/*.js{,x}': wallaby.compilers.babel()
    },
    tests: [{ pattern: 'tests/**/*.spec.js' }],
    env: {
      type: 'node'
    },
    testFramework: 'mocha',
    setup: () => {
      require('./tests/tests.js')
    }
  }
}

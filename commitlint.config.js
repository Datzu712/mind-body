module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-enum': [
            2,
            'always',
            ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'],
        ],
        'subject-case': [1, 'always', 'lower-case'],
        'body-max-line-length': [2, 'always', 100],
        'header-max-length': [2, 'always', 100],
    },
};

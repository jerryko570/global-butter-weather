module.exports = {
  extends: ['@commitlint/config-conventional'],
  // 커밋 메시지 맨 앞에 이모지(gitmoji)를 "선택적으로" 붙일 수 있게 파서를 확장한다.
  //   허용 예)  feat: 상품 목록 추가
  //             ✨ feat: 상품 목록 추가
  //             ⚙️ chore(config): 설정 정리
  //   이모지가 없어도 표준 conventional 형식이면 그대로 통과.
  parserPreset: {
    parserOpts: {
      headerPattern:
        /^(?:([\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{FE0F}\u{200D}]+)\s+)?(\w+)(?:\(([^)]+)\))?(!)?:\s(.+)$/u,
      headerCorrespondence: ['emoji', 'type', 'scope', 'breaking', 'subject'],
    },
  },
  rules: {
    'type-enum': [
      2,
      'always',
      ['chore', 'feat', 'refactor', 'fix', 'docs', 'style', 'test'],
    ],
  },
}

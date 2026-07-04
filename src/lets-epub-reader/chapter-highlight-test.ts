/**
 * 测试章节高亮渲染优化功能
 * 测试基于章节的标注渲染是否正常工作
 */

import { extractChapterIdFromCfi, getCurrentChapterCfi } from './epub-utils';
import type { Annotation } from './types';
import { HIGHLIGHT_COLORS } from './types';
import { getLogger } from "@/libs/logger";
const log = getLogger("lets-epub-reader");

/**
 * 测试从CFI中提取章节ID
 */
function testExtractChapterIdFromCfi() {
  log.info('🧪 测试章节ID提取功能');
  
  // 测试用例
  const testCases = [
    {
      cfi: 'epubcfi(/6/4[chap01ref]!/4[body01]/10[para05])',
      expected: 'chap01ref',
      description: '标准格式的CFI，有方括号内的章节ID'
    },
    {
      cfi: 'epubcfi(/6/4/chap02)',
      expected: 'chapter-4',
      description: '没有方括号，使用数字路径的章节ID'
    },
    {
      cfi: 'epubcfi(/6/4)',
      expected: 'chapter-4',
      description: '简单的数字路径'
    },
    {
      cfi: 'epubcfi(/10/20[chapter3]/30)',
      expected: 'chapter3',
      description: '方括号在路径中间'
    },
    {
      cfi: 'epubcfi(/6/4[chap01]!/4[body]/10[para],/2/1:3,/3:4)',
      expected: 'chap01',
      description: '包含范围的CFI'
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    const result = extractChapterIdFromCfi(testCase.cfi);
    if (result === testCase.expected) {
      log.info(`✅ 通过: ${testCase.description}`);
      log.info(`   输入: ${testCase.cfi}`);
      log.info(`   输出: ${result}`);
      passed++;
    } else {
      log.info(`❌ 失败: ${testCase.description}`);
      log.info(`   输入: ${testCase.cfi}`);
      log.info(`   期望: ${testCase.expected}`);
      log.info(`   实际: ${result}`);
      failed++;
    }
  }
  
  log.info(`\n📊 章节ID提取测试结果: 通过 ${passed}/${testCases.length}, 失败 ${failed}/${testCases.length}`);
  return { passed, failed };
}

/**
 * 测试章节过滤功能
 */
function testChapterFiltering() {
  log.info('\n🧪 测试章节过滤功能');
  
  // 创建测试标注
  const testAnnotations: Annotation[] = [
    {
      id: 'ann1',
      type: 'highlight',
      text: 'Test highlight 1',
      cfiRange: 'epubcfi(/6/4[chap01]!/4[body]/10[para])',
      epubCfi: 'epubcfi(/6/4[chap01]!/4[body]/10[para])',
      color: HIGHLIGHT_COLORS[0],
      chapterId: 'chap01',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'ann2',
      type: 'highlight',
      text: 'Test highlight 2',
      cfiRange: 'epubcfi(/6/6[chap02]!/4[body]/10[para])',
      epubCfi: 'epubcfi(/6/6[chap02]!/4[body]/10[para])',
      color: HIGHLIGHT_COLORS[0],
      chapterId: 'chap02',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'ann3',
      type: 'highlight',
      text: 'Test highlight 3',
      cfiRange: 'epubcfi(/6/8[chap01]!/4[body]/10[para])',
      epubCfi: 'epubcfi(/6/8[chap01]!/4[body]/10[para])',
      color: HIGHLIGHT_COLORS[0],
      chapterId: 'chap01',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  ];
  
  // 模拟 AnnotationManager 的过滤方法
  function filterAnnotationsByChapter(annotations: Annotation[], chapterId: string): Annotation[] {
    return annotations.filter(annotation => {
      // 如果标注有章节ID，直接比较
      if (annotation.chapterId) {
        return annotation.chapterId === chapterId;
      }
      
      // 如果没有章节ID，尝试从CFI中提取
      const extractedChapterId = extractChapterIdFromCfi(annotation.cfiRange);
      return extractedChapterId === chapterId;
    });
  }
  
  // 测试用例
  const testCases = [
    {
      chapterId: 'chap01',
      expectedCount: 2,
      expectedIds: ['ann1', 'ann3'],
      description: '过滤chap01章节的标注'
    },
    {
      chapterId: 'chap02',
      expectedCount: 1,
      expectedIds: ['ann2'],
      description: '过滤chap02章节的标注'
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    const filtered = filterAnnotationsByChapter(testAnnotations, testCase.chapterId);
    
    if (filtered.length === testCase.expectedCount && 
        filtered.every(a => testCase.expectedIds.includes(a.id))) {
      log.info(`✅ 通过: ${testCase.description}`);
      log.info(`   章节ID: ${testCase.chapterId}`);
      log.info(`   过滤结果: ${filtered.length} 个标注`);
      passed++;
    } else {
      log.info(`❌ 失败: ${testCase.description}`);
      log.info(`   章节ID: ${testCase.chapterId}`);
      log.info(`   期望: ${testCase.expectedCount} 个标注 (${testCase.expectedIds.join(', ')})`);
      log.info(`   实际: ${filtered.length} 个标注 (${filtered.map(a => a.id).join(', ')})`);
      failed++;
    }
  }
  
  log.info(`\n📊 章节过滤测试结果: 通过 ${passed}/${testCases.length}, 失败 ${failed}/${testCases.length}`);
  return { passed, failed };
}

/**
 * 运行所有测试
 */
export function runChapterHighlightTests() {
  log.info('🚀 开始运行章节高亮渲染优化测试');
  log.info('='.repeat(50));
  
  const results1 = testExtractChapterIdFromCfi();
  const results2 = testChapterFiltering();
  
  log.info('\n' + '='.repeat(50));
  log.info('📈 总体测试结果');
  log.info(`章节ID提取: ${results1.passed}/${results1.passed + results1.failed} 通过`);
  log.info(`章节过滤: ${results2.passed}/${results2.passed + results2.failed} 通过`);
  
  const totalPassed = results1.passed + results2.passed;
  const totalTests = results1.passed + results1.failed + results2.passed + results2.failed;
  
  log.info(`\n🎉 总体通过率: ${totalPassed}/${totalTests} (${Math.round(totalPassed/totalTests*100)}%)`);
  
  if (totalPassed === totalTests) {
    log.info('✅ 所有测试通过！章节高亮渲染优化功能正常工作。');
  } else {
    log.info('⚠️ 部分测试失败，请检查实现。');
  }
  
  return { totalPassed, totalTests };
}
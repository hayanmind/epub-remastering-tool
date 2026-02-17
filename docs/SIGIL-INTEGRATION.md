# Sigil 플러그인 연동 분석

## 개요

[Sigil](https://sigil-ebook.com)은 오픈소스 ePub 에디터(C++/Python, GPLv3)로, 6,600+ GitHub stars를 보유하고 있으며 활발히 유지보수되고 있습니다(최신: v2.7.0, 2025-12). Python 플러그인 시스템을 통해 기능 확장이 가능합니다.

**결론: 연동 가능하며, 전략적으로 유의미합니다.**

## Sigil 플러그인 시스템

### 구조

Sigil 플러그인은 ZIP 아카이브로 배포되며, 두 개의 필수 파일로 구성됩니다:

**plugin.xml** (매니페스트):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<plugin>
  <name>PluginName</name>
  <type>edit</type>              <!-- input | output | edit | validation -->
  <author>AuthorName</author>
  <description>Short description.</description>
  <engine>python3.4</engine>     <!-- 최소 Python 버전 -->
  <version>1.0.0</version>
  <oslist>osx,unx,win</oslist>   <!-- 지원 플랫폼 -->
  <autostart>true</autostart>
  <autoclose>true</autoclose>
</plugin>
```

**plugin.py** (진입점):
```python
def run(bk):
    # bk = BookContainer (edit), InputContainer, OutputContainer, ValidationContainer
    # ... 플러그인 로직 ...
    return 0  # 0 = 성공
```

### 4가지 플러그인 타입

| 타입 | 컨테이너 | 용도 |
|------|----------|------|
| `edit` | BookContainer | 열린 ePub을 직접 수정 |
| `input` | InputContainer | 외부 형식을 ePub으로 가져오기 |
| `output` | OutputContainer | ePub을 외부 형식으로 내보내기 |
| `validation` | ValidationContainer | ePub 검사 및 리포트 |

### BookContainer API 주요 기능

- **파일 읽기/쓰기**: `readfile(id)`, `writefile(id, data)`, `addfile()`, `deletefile()`
- **OPF 조작**: `getmetadataxml()`, `setmetadataxml()`, `getspine()`, `setspine()`
- **반복자**: `text_iter()`, `css_iter()`, `image_iter()`, `manifest_iter()`
- **경로 변환**: `href_to_id()`, `id_to_href()`, `id_to_bookpath()`
- **ePub 버전**: `epub_version()` — "2.0" 또는 "3.0" 반환
- **전체 복사**: `copy_book_contents_to(destdir)` — 임시 디렉토리로 추출
- **환경설정**: `getPrefs()`, `savePrefs()` — 영구 설정 저장
- **자동화**: `using_automate()`, `automate_parameter()` — 배치 처리 지원

### 기술 제약사항

- **Python 전용**: 다른 언어 지원 없음 (컴파일된 C 확장은 가능)
- **샌드박싱 없음**: 파일시스템, 네트워크 등 시스템 자원 접근 제한 없음
- **동기 실행**: 비동기/이벤트 루프 미지원
- **GUI**: Tkinter 기본 포함, PyQt5/PySide6 선택적
- **플랫폼 선언 필수**: `plugin.xml`의 `oslist`에 지원 OS 명시

## 기존 유사 플러그인

### ePub3-itizer (Kevin Hendricks)

**이미 ePub 2→3 변환을 수행하는 Sigil 플러그인이 존재합니다.**

- 저자: Kevin Hendricks (Sigil 핵심 개발자)
- 리포지토리: [github.com/kevinhendricks/ePub3-itizer](https://github.com/kevinhendricks/ePub3-itizer)
- 타입: `output` (원본은 보존, 새 파일 생성)
- 처리 과정:
  1. ePub 2.0 검증
  2. `bk.copy_book_contents_to()` 로 임시 디렉토리 추출
  3. DOCTYPE → HTML5, 네임스페이스 추가
  4. OPF 업데이트 (Dublin Core, dcterms:modified)
  5. NCX → `nav.xhtml` 변환
  6. ePub 3.0 ZIP 패키징

### Access-Aide

- 접근성 개선 플러그인
- `edit` 타입
- alt 텍스트, ARIA 속성 등 삽입

## 연동 전략

### 방안 1: Sigil 플러그인으로 @gov-epub/core 호출 (권장)

Python 플러그인에서 subprocess로 Node.js 기반 `@gov-epub/core` CLI를 호출합니다.

```python
# plugin.py
import subprocess, json, os, tempfile

def run(bk):
    # 1. ePub을 임시 디렉토리로 추출
    tmpdir = tempfile.mkdtemp()
    bk.copy_book_contents_to(tmpdir)

    # 2. 임시 ePub 파일 생성
    epub_path = os.path.join(tmpdir, 'input.epub')
    create_epub_from_dir(tmpdir, epub_path)

    # 3. @gov-epub/core CLI 호출
    result = subprocess.run(
        ['npx', '@gov-epub/core', 'convert', epub_path,
         '--output', os.path.join(tmpdir, 'output.epub'),
         '--options', json.dumps({
             'enableQuiz': True,
             'enableTts': False,
             'enableSummary': True
         })],
        capture_output=True, text=True
    )

    # 4. 변환된 ePub에서 파일 업데이트
    if result.returncode == 0:
        apply_converted_files(bk, tmpdir)

    return 0
```

**장점**:
- 핵심 변환 로직을 재작성할 필요 없음
- TypeScript로 작성된 정교한 파싱/변환 로직 재활용
- 업데이트를 npm 패키지로 배포 가능

**단점**:
- Node.js 런타임이 사용자 시스템에 필요
- subprocess 호출의 오버헤드

### 방안 2: REST API 호출

Sigil 플러그인에서 HTTP로 로컬/원격 API 서버를 호출합니다.

```python
import urllib.request, json

def run(bk):
    tmpdir = tempfile.mkdtemp()
    bk.copy_book_contents_to(tmpdir)
    epub_path = create_epub(tmpdir)

    # API 서버로 업로드 및 변환
    with open(epub_path, 'rb') as f:
        # ... multipart upload to localhost:3001/api/upload ...
        pass

    return 0
```

**장점**:
- Node.js 불필요 (원격 서버 사용 시)
- Sigil 플러그인은 가벼움

**단점**:
- API 서버가 실행 중이어야 함
- 네트워크 의존성

### 방안 3: 순수 Python 재구현 (장기)

`@gov-epub/core`의 핵심 로직을 Python으로 포팅합니다.

**장점**: 외부 의존성 없음, Sigil 생태계 네이티브
**단점**: 이중 유지보수, 구현 비용 높음

## 권장 로드맵

| 단계 | 작업 | 기간 |
|------|------|------|
| **Phase 1** | @gov-epub/core에 CLI 인터페이스 추가 | 1주 |
| **Phase 2** | Sigil output 플러그인 프로토타입 (subprocess 방식) | 1주 |
| **Phase 3** | 설정 GUI (Tkinter), 변환 옵션 선택 | 1주 |
| **Phase 4** | MobileRead 포럼 / Sigil Plugin Index 등록 | 1주 |
| **Phase 5** | (선택) Python 네이티브 파서 구현 | 장기 |

## 개발 시 참고사항

### CLI 인터페이스 설계 (Phase 1)

```bash
# 기본 변환
npx @gov-epub/core convert input.epub -o output.epub

# 옵션 지정
npx @gov-epub/core convert input.epub -o output.epub \
  --quiz --tts --summary \
  --format json  # 진행 상태를 JSON으로 출력 (플러그인 연동용)
```

### Sigil Plugin Index 등록 요건

1. ZIP 파일 형식, `plugin.xml` + `plugin.py` 포함
2. MobileRead 포럼에 게시
3. GPL 호환 라이선스 (현재 MIT → 호환 가능)
4. Python 3.4+ 호환

### ePub3-itizer와의 차별점

| 기능 | ePub3-itizer | gov-epub 플러그인 |
|------|-------------|-------------------|
| 기본 변환 (HTML5, OPF, Nav) | O | O |
| AI 퀴즈 자동 생성 | X | O |
| TTS + SMIL 미디어 오버레이 | X | O |
| AI 이미지 추천 | X | O |
| 접근성 자동 태깅 (KWCAG) | X | O |
| 시맨틱 재구조화 | X | O |
| Mock 모드 (API 키 불필요) | X | O |

## 참고 자료

- [Sigil GitHub](https://github.com/Sigil-Ebook/Sigil)
- [Sigil Plugin API Guide](https://github.com/Sigil-Ebook/plugin-api-guide)
- [BookContainer API](https://github.com/Sigil-Ebook/Sigil/blob/master/src/Resource_Files/plugin_launchers/python/bookcontainer.py)
- [ePub3-itizer](https://github.com/kevinhendricks/ePub3-itizer)
- [Sigil Plugin Index (MobileRead)](https://www.mobileread.com/forums/showthread.php?t=247431)
- [Access-Aide Plugin](https://epubsecrets.com/access-aide-a-new-epub-accessibility-plugin-for-sigil.php)

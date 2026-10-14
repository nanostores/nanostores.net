import { slug } from 'github-slugger'
import ts from 'typescript'

export interface ApiGroup {
  label: string
  names: string[]
}

export type ApiKind = 'functions' | 'variables' | 'interfaces' | 'type-aliases'

export interface ApiExport {
  kind: ApiKind
  // First sentence of the TSDoc, empty when the export has none.
  summary: string
  deprecated: boolean
  callable?: {
    description: string
    signatures: { code: string; deprecated: string }[]
  }
  members?: { name: string; owner: string }[]
}

const kinds: Partial<Record<ts.SyntaxKind, ApiKind>> = {
  [ts.SyntaxKind.FunctionDeclaration]: 'functions',
  [ts.SyntaxKind.VariableDeclaration]: 'variables',
  [ts.SyntaxKind.InterfaceDeclaration]: 'interfaces',
  [ts.SyntaxKind.TypeAliasDeclaration]: 'type-aliases',
}

const firstSentence = (doc: string): string => {
  const paragraph = doc
    .split(/\n\s*\n/)[0]
    .replace(/\s+/g, ' ')
    .trim()
  return paragraph.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? paragraph
}

// Reads exports the same way TypeDoc sorts them into folders. `computed`,
// `batched` and `effect` are constants of an interface type, so their
// description lives on the call signature, not on the constant.
export function readApiExports(entry: string): Map<string, ApiExport> {
  const program = ts.createProgram([entry], {
    strict: true,
    skipLibCheck: true,
    noEmit: true,
  })
  const checker = program.getTypeChecker()
  const source = program.getSourceFile(entry)
  const module = source && checker.getSymbolAtLocation(source)
  if (!module) throw new Error(`Cannot read exports of ${entry}`)

  const result = new Map<string, ApiExport>()
  const symbols = checker.getExportsOfModule(module)
  const exportNames = new Set(symbols.map((symbol) => symbol.name))
  for (const exported of symbols) {
    const symbol =
      exported.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(exported)
        : exported
    const declaration = symbol.declarations?.[0]
    const kind = declaration && kinds[declaration.kind]
    if (!kind) throw new Error(`Unknown kind of the ${exported.name} export`)

    let doc = ts.displayPartsToString(symbol.getDocumentationComment(checker))
    if (!doc && kind === 'variables') {
      const signature = checker
        .getTypeOfSymbol(symbol)
        .getCallSignatures()
        .find(
          (call) =>
            call.getDocumentationComment(checker).length > 0 &&
            !call.getJsDocTags().some((tag) => tag.name === 'deprecated'),
        )
      if (signature) {
        doc = ts.displayPartsToString(
          signature.getDocumentationComment(checker),
        )
      }
    }
    const api: ApiExport = {
      kind,
      summary: doc ? firstSentence(doc) : '',
      deprecated: symbol
        .getJsDocTags(checker)
        .some((tag) => tag.name === 'deprecated'),
    }
    if (kind === 'variables') {
      const signatures = checker.getTypeOfSymbol(symbol).getCallSignatures()
      if (signatures.length) {
        api.callable = {
          description: ts.displayPartsToString(
            signatures
              .find(
                (call) =>
                  call.getDocumentationComment(checker).length &&
                  !call.getJsDocTags().some((tag) => tag.name === 'deprecated'),
              )
              ?.getDocumentationComment(checker),
          ),
          signatures: signatures.map((call) => ({
            code:
              exported.name +
              checker.signatureToString(
                call,
                undefined,
                ts.TypeFormatFlags.NoTruncation,
              ),
            deprecated: ts.displayPartsToString(
              call.getJsDocTags().find((tag) => tag.name === 'deprecated')
                ?.text,
            ),
          })),
        }
      }
    }
    if (kind === 'interfaces' || kind === 'type-aliases') {
      api.members = checker
        .getDeclaredTypeOfSymbol(symbol)
        .getProperties()
        .filter(
          (member) =>
            kind === 'interfaces' ||
            member.declarations?.some((node) =>
              node
                .getSourceFile()
                .fileName.replaceAll('\\', '/')
                .includes('/nanostores/'),
            ),
        )
        .flatMap((member) => {
          let parent = member.declarations?.[0]?.parent
          while (
            parent &&
            !(
              ts.isInterfaceDeclaration(parent) ||
              ts.isTypeAliasDeclaration(parent)
            )
          ) {
            parent = parent.parent
          }
          // TypeDoc omits undocumented objects nested in intersections.
          // Direct type literals (Gettable) and documented members still
          // have their own sections; array/string built-ins do not.
          if (
            kind === 'type-aliases' &&
            parent &&
            ts.isTypeAliasDeclaration(parent) &&
            !ts.isTypeLiteralNode(parent.type) &&
            !member.getDocumentationComment(checker).length
          )
            return []
          return [
            {
              name: member.name.replace(/^__@([^@]+)@\d+$/, '$1'),
              owner:
                parent &&
                (ts.isInterfaceDeclaration(parent) ||
                  ts.isTypeAliasDeclaration(parent)) &&
                exportNames.has(parent.name.text)
                  ? parent.name.text
                  : exported.name,
            },
          ]
        })
    }
    result.set(exported.name, api)
  }
  return result
}

export const deprecatedGroup = 'Deprecated'

// Every export is listed once, and the Deprecated group holds exactly
// the deprecated ones.
export function apiGroupProblems(
  groups: ApiGroup[],
  exports: Map<string, ApiExport>,
): string[] {
  const problems: string[] = []
  const seen = new Set<string>()
  for (const group of groups) {
    for (const name of group.names) {
      const api = exports.get(name)
      if (seen.has(name)) problems.push(`${name} is listed twice`)
      seen.add(name)
      if (!api) {
        problems.push(`${name} is not exported by nanostores`)
      } else if (api.deprecated !== (group.label === deprecatedGroup)) {
        problems.push(
          api.deprecated
            ? `${name} is deprecated; move it to ${deprecatedGroup}`
            : `${name} is not deprecated; move it out of ${deprecatedGroup}`,
        )
      }
    }
  }
  for (const name of exports.keys()) {
    if (!seen.has(name)) problems.push(`${name} is missing from the API groups`)
  }
  return problems
}

export function checkApiGroups(
  groups: ApiGroup[],
  exports: Map<string, ApiExport>,
): void {
  const problems = apiGroupProblems(groups, exports)
  if (problems.length > 0) {
    throw new Error(
      'src/config/api-groups.ts is out of sync with nanostores:\n' +
        problems.map((problem) => `- ${problem}`).join('\n'),
    )
  }
}

// Type names and runtime names can differ only in case: Atom/atom,
// Task/task and MapCreator/mapCreator. Keep their anchors distinct.
export const apiAnchor = (name: string): string =>
  `${/^[A-Z]/.test(name) && name !== 'STORE_UNMOUNT_DELAY' ? 'type-' : ''}${slug(name)}`

export const apiLink = (name: string): string => `/docs/api/#${apiAnchor(name)}`

export const storeMethods = [
  { owner: 'ReadableAtom', name: 'get' },
  { owner: 'WritableAtom', name: 'set' },
  { owner: 'MapStore', name: 'setKey' },
  { owner: 'ReadableAtom', name: 'listen' },
  { owner: 'ReadableAtom', name: 'subscribe' },
]

export const apiMemberAnchor = (owner: string, name: string): string =>
  storeMethods.some((method) => method.owner === owner && method.name === name)
    ? `store-${slug(name)}`
    : `${apiAnchor(owner)}-${slug(name)}`

// Shared by the page index and sidebar; preserve the configured export order.
export const hasStoreMethods = (group: ApiGroup): boolean =>
  group.names.includes('atom')

export function apiNavigation(groups: ApiGroup[]) {
  return groups.flatMap((group) => {
    const entry = {
      label: group.label,
      anchor: slug(group.label),
      items: group.names.map((name) => ({
        label: name,
        anchor: apiAnchor(name),
      })),
    }
    return hasStoreMethods(group)
      ? [
          entry,
          {
            label: 'Store methods',
            anchor: 'store-methods',
            items: storeMethods.map(({ owner, name }) => ({
              label: `${name}()`,
              anchor: apiMemberAnchor(owner, name),
            })),
          },
        ]
      : [entry]
  })
}

export function apiSidebar() {
  // Starlight uses page links for pagination; SiteSidebar adds section links.
  return {
    label: 'API',
    collapsed: true,
    items: [{ label: 'Overview', link: '/docs/api/' }],
  }
}

// TypeDoc renders this as the /docs/api/ page.
export function apiOverview(): string {
  return 'Reference for stores, subscriptions, lifecycle hooks and TypeScript types.\n'
}

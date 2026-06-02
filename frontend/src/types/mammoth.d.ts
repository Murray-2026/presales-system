declare module 'mammoth' {
  export function extractRawText(options: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }>
  export function convertToHtml(options: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }>
}

// Vite's `?inline` CSS import, also needed by the Angular compiler, which does not read vite/client.
declare module '*.css?inline' {
  const css: string;
  export default css;
}

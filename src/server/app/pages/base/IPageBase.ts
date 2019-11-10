export module IPageBase {
  export interface Listener {
    renderPage(req, res, viewName: string, title: string, description: string, keywords: string, disableIndexing: boolean, params?: any): void;
  }
}

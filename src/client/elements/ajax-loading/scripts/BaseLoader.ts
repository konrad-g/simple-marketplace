abstract class BaseLoader {
  public abstract init(isOtherLoadingCallback: any, triggerOn: any, mainContainerId: string): any;
  public abstract isLoading(): boolean;
  public abstract stopLoading();
  public abstract setOnLoadStartedListener(callback: (isNewPage: boolean, isReloadingPreviousPage: boolean) => void);
  public abstract setOnLoadFinishedListener(callback: any);
  public abstract setCancelRequest(cancelRequest: (xhrRequest?: any) => void);
  public abstract notifyPageChange();
}

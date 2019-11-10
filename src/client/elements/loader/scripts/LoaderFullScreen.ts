class LoaderFullScreen {
  private static FULL_SCREEN_ID: string = "loader-full-screen";
  private static FADE_TIME_MS: number = 300;

  public static show(message: string): boolean {
    if (!message || message.length === 0) message = "Loading...";

    if (LoaderFullScreen.isOpen()) {
      return false;
    }

    $("body").append(
      "<div id='" +
        LoaderFullScreen.FULL_SCREEN_ID +
        "' class='loader-full-screen'>" +
        "<div class='loader-full-screen-card-spinner'><div class='loader-spinner'></div></div>" +
        "<br/>" +
        "<div class='loader-full-screen-card-messege'>" +
        message +
        "</div>" +
        "</div>"
    );

    $("#" + LoaderFullScreen.FULL_SCREEN_ID).hide();
    $("#" + LoaderFullScreen.FULL_SCREEN_ID).fadeIn(LoaderFullScreen.FADE_TIME_MS);

    return true;
  }

  public static hide() {
    if (LoaderFullScreen.isOpen()) {
      $("#" + LoaderFullScreen.FULL_SCREEN_ID).stop();
      $("#" + LoaderFullScreen.FULL_SCREEN_ID).fadeOut(LoaderFullScreen.FADE_TIME_MS, () => {
        $("#" + LoaderFullScreen.FULL_SCREEN_ID).remove();
      });
    }
  }

  public static isOpen(): boolean {
    return $("#" + LoaderFullScreen.FULL_SCREEN_ID).length > 0;
  }
}

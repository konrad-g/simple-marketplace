class AjaxForm {
    constructor(selectorForm, selectorMessageContainer, updateUrl = false, displayRawResponseOnSuccess = false, enableFormOnSuccess = false) {
        this.displayRawResponseOnSuccess = false;
        this.enableFormOnSuccess = false;
        this.updateUrl = false;
        this.selectorForm = selectorForm;
        this.messageContainer = $(selectorMessageContainer);
        this.isLoading = false;
        this.displayRawResponseOnSuccess = displayRawResponseOnSuccess;
        this.enableFormOnSuccess = enableFormOnSuccess;
        this.updateUrl = updateUrl;
        this.onSubmit = [];
    }
    init() {
        const self = this;
        let forms = $(this.selectorForm);
        if (forms.constructor !== Array)
            forms = [forms];
        for (let form of forms) {
            this.setupForm(form);
        }
    }
    setupForm(form) {
        const self = this;
        $(form)
            .off("submit")
            .on("submit", function (event) {
            event.preventDefault();
            let form = $(this);
            for (let submit of self.onSubmit) {
                let result = submit(event, form);
                if (!result)
                    return false;
            }
            if (!!form.parsley) {
                if (!form.parsley().isValid || !form.parsley().isValid()) {
                    form.parsley().validate();
                    return false;
                }
            }
            if (self.isLoading)
                return true;
            let url = form.attr("action");
            let data = new FormData($(this)[0]);
            let dataArray = $(this).serializeArray();
            let method = form.attr("method");
            self.disableForm(form);
            self.isLoading = true;
            if (self.customRequest) {
                self.customRequest(url, method, dataArray);
                return false;
            }
            $.ajax({
                url: url,
                method: method,
                data: data,
                processData: false,
                contentType: false,
                enctype: "multipart/form-data",
                complete: (response, xhr, settings) => {
                    let responseText = response.responseText;
                    self.isLoading = false;
                    if (self.updateUrl && (!method || method.toUpperCase() === "GET") && history.pushState) {
                        url = self.getGetUrl(url, dataArray);
                        history.pushState($.pjax.state, document.title, url);
                    }
                    let status = response.status;
                    if (status === 200) {
                        self.showMessage(responseText, "success");
                        if (self.enableFormOnSuccess)
                            self.enableForm();
                        if (!!self.onSuccess)
                            self.onSuccess(response, form);
                    }
                    else if (status === 301 || status === 302) {
                        self.showMessage(responseText, "warning");
                        if (self.enableFormOnSuccess)
                            self.enableForm();
                        if (!!self.onRedirect)
                            self.onRedirect(response, form);
                    }
                    else {
                        self.showMessage(responseText, "danger");
                        self.enableForm();
                        if (!!self.onError)
                            self.onError(response, form);
                    }
                    event.preventDefault();
                    return false;
                }
            });
            return false;
        });
    }
    getGetUrl(url, dataArray) {
        if (url.indexOf("?") === url.length - 1)
            url = url.substr(0, url.length - 1);
        let index = 0;
        for (let dataEntry of dataArray) {
            let key = dataEntry["name"];
            let value = encodeURIComponent(dataEntry["value"]);
            if (!key || key === "ajax" || key === "_csrf" || key === "pjax" || key === "_pjax")
                continue;
            if (index === 0)
                url += "?" + key + "=" + value;
            else
                url += "&" + key + "=" + value;
            index++;
        }
        return url;
    }
    showMessage(text, type) {
        if (this.messageContainer.length === 0 || !text || text.length === 0 || !type || type.length === 0)
            return;
        if (this.isTextJson(text)) {
            let textJson = JSON.parse(text);
            if (!!textJson["msg"] && textJson["msg"].length > 0) {
                text = textJson["msg"];
            }
            if (!!textJson[0] && !!textJson[0].msg) {
                text = "";
                for (let textEntry of textJson) {
                    if (text.length > 0)
                        text += "<br/>";
                    text += textEntry.msg;
                }
            }
        }
        let html = "";
        if (this.displayRawResponseOnSuccess && type === "success") {
            html = text;
        }
        else {
            html = '<div class="alert alert-' + type + ' fade in">' + '<button type="button" data-dismiss="alert" class="close"><i class="fa fa-text fa-times-circle-o"></i></button>' + text + "</div>";
        }
        this.messageContainer.html(html);
    }
    setCustomRequest(customRequest) {
        this.customRequest = customRequest;
    }
    setIsLoading(isLoading) {
        this.isLoading = isLoading;
    }
    enableForm() {
        this.formInput.each(function () {
            $(this).removeAttr("disabled");
        });
        this.formTextArea.each(function () {
            $(this).removeAttr("disabled");
        });
        this.formSelect.each(function () {
            $(this).removeAttr("disabled");
        });
        this.formButton.each(function () {
            $(this).removeAttr("disabled");
        });
        this.formLinkAjax.each(function () {
            $(this).addClass("ajax");
        });
        this.formLink.each(function () {
            $(this).removeAttr("disabled");
            $(this).attr("href", "javascript:void(0);");
            let link = $(this).attr("link");
            $(this).attr("href", link);
            $(this).removeAttr("link");
        });
        this.formButtonShowLoading.each(function () {
            $(this)
                .find(".app-loader-in-button")
                .remove();
        });
    }
    disableForm(form) {
        this.formInput = $("input:not([disabled])", form);
        this.formTextArea = $("textarea:not([disabled])", form);
        this.formSelect = $("select:not([disabled])", form);
        this.formButton = $("button:not([disabled])", form);
        this.formLinkAjax = $("a.ajax", form);
        this.formLink = $("a:not([disabled])", form);
        this.formButtonShowLoading = $("button.app-show-loading:submit", form);
        this.formInput.each(function () {
            $(this).prop("disabled", "true");
        });
        this.formTextArea.each(function () {
            $(this).prop("disabled", "true");
        });
        this.formSelect.each(function () {
            $(this).prop("disabled", "true");
        });
        this.formButton.each(function () {
            $(this).prop("disabled", "true");
        });
        this.formLinkAjax.each(function () {
            $(this).removeClass("ajax");
        });
        this.formLink.each(function () {
            $(this).attr("disabled", "true");
            let link = $(this).attr("href");
            $(this).attr("link", link);
            $(this).attr("href", "javascript:void(0);");
        });
        this.formButtonShowLoading.each(function () {
            $(this).append("<div class='app-loader-in-button'></div>");
        });
    }
    validate() {
        let form = $(this.selectorForm);
        let parsley = form.parsley();
        if (!!parsley)
            parsley.validate();
    }
    setOnSubmitListener(onSubmit) {
        this.onSubmit.push(onSubmit);
    }
    setOnSuccessListener(onSuccess) {
        this.onSuccess = onSuccess;
    }
    setOnRedirectListener(onRedirect) {
        this.onRedirect = onRedirect;
    }
    setOnErrorListener(onError) {
        this.onError = onError;
    }
    isTextJson(str) {
        try {
            JSON.parse(str);
        }
        catch (event) {
            return false;
        }
        return true;
    }
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jbGllbnQvZWxlbWVudHMvYWpheC1mb3JtL3NjcmlwdHMvQWpheEZvcm0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7SUFzQkUsWUFBWSxZQUFhLEVBQUUsd0JBQXlCLEVBQUUsWUFBcUIsS0FBSyxFQUFFLDhCQUF1QyxLQUFLLEVBQUUsc0JBQStCLEtBQUs7UUFKNUosZ0NBQTJCLEdBQVksS0FBSyxDQUFDO1FBQzdDLHdCQUFtQixHQUFZLEtBQUssQ0FBQztRQUNyQyxjQUFTLEdBQVksS0FBSyxDQUFDO1FBR2pDLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLENBQUMsd0JBQXdCLENBQUMsQ0FBQztRQUNwRCxJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztRQUN2QixJQUFJLENBQUMsMkJBQTJCLEdBQUcsMkJBQTJCLENBQUM7UUFDL0QsSUFBSSxDQUFDLG1CQUFtQixHQUFHLG1CQUFtQixDQUFDO1FBQy9DLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1FBQzNCLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO0lBQ3JCLENBQUM7SUFFRCxJQUFJO1FBQ0YsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLElBQUksS0FBSyxHQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDdEMsSUFBSSxLQUFLLENBQUMsV0FBVyxLQUFLLEtBQUs7WUFBRSxLQUFLLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUVqRCxLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssRUFBRTtZQUN0QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3RCO0lBQ0gsQ0FBQztJQUVELFNBQVMsQ0FBQyxJQUFJO1FBQ1osTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBRWxCLENBQUMsQ0FBQyxJQUFJLENBQUM7YUFDSixHQUFH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QUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO0lBQ3pCLENBQUM7SUFFRCxVQUFVLENBQUMsR0FBRztRQUNaLElBQUk7WUFDRixJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ2pCO1FBQUMsT0FBTyxLQUFLLEVBQUU7WUFDZCxPQUFPLEtBQUssQ0FBQztTQUNkO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0NBQ0YiLCJmaWxlIjoic3JjL2NsaWVudC9lbGVtZW50cy9hamF4LWZvcm0vc2NyaXB0cy9BamF4Rm9ybS5qcyIsInNvdXJjZXNDb250ZW50IjpbImNsYXNzIEFqYXhGb3JtIHtcbiAgcHJpdmF0ZSBzZWxlY3RvckZvcm07XG4gIHByaXZhdGUgbWVzc2FnZUNvbnRhaW5lcjtcbiAgcHJpdmF0ZSBvblN1Ym1pdDogQXJyYXk8KGV2ZW50LCBmb3JtKSA9PiB2b2lkPjtcbiAgcHJpdmF0ZSBvblN1Y2Nlc3M6IChyZXNwb25zZSwgZm9ybSkgPT4gdm9pZDtcbiAgcHJpdmF0ZSBvblJlZGlyZWN0OiAocmVzcG9uc2UsIGZvcm0pID0+IHZvaWQ7XG4gIHByaXZhdGUgb25FcnJvcjogKHJlc3BvbnNlLCBmb3JtKSA9PiB2b2lkO1xuICBwcml2YXRlIGN1c3RvbVJlcXVlc3Q6ICh1cmwsIG1ldGhvZCwgZGF0YUFycmF5KSA9PiB2b2lkO1xuXG4gIHByaXZhdGUgZm9ybUlucHV0O1xuICBwcml2YXRlIGZvcm1UZXh0QXJlYTtcbiAgcHJpdmF0ZSBmb3JtU2VsZWN0O1xuICBwcml2YXRlIGZvcm1CdXR0b247XG4gIHByaXZhdGUgZm9ybUxpbmtBamF4O1xuICBwcml2YXRlIGZvcm1MaW5rO1xuICBwcml2YXRlIGZvcm1CdXR0b25TaG93TG9hZGluZztcblxuICBwcml2YXRlIGlzTG9hZGluZztcbiAgcHJpdmF0ZSBkaXNwbGF5UmF3UmVzcG9uc2VPblN1Y2Nlc3M6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBlbmFibGVGb3JtT25TdWNjZXNzOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgdXBkYXRlVXJsOiBib29sZWFuID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3Ioc2VsZWN0b3JGb3JtPywgc2VsZWN0b3JNZXNzYWdlQ29udGFpbmVyPywgdXBkYXRlVXJsOiBib29sZWFuID0gZmFsc2UsIGRpc3BsYXlSYXdSZXNwb25zZU9uU3VjY2VzczogYm9vbGVhbiA9IGZhbHNlLCBlbmFibGVGb3JtT25TdWNjZXNzOiBib29sZWFuID0gZmFsc2UpIHtcbiAgICB0aGlzLnNlbGVjdG9yRm9ybSA9IHNlbGVjdG9yRm9ybTtcbiAgICB0aGlzLm1lc3NhZ2VDb250YWluZXIgPSAkKHNlbGVjdG9yTWVzc2FnZUNvbnRhaW5lcik7XG4gICAgdGhpcy5pc0xvYWRpbmcgPSBmYWxzZTtcbiAgICB0aGlzLmRpc3BsYXlSYXdSZXNwb25zZU9uU3VjY2VzcyA9IGRpc3BsYXlSYXdSZXNwb25zZU9uU3VjY2VzcztcbiAgICB0aGlzLmVuYWJsZUZvcm1PblN1Y2Nlc3MgPSBlbmFibGVGb3JtT25TdWNjZXNzO1xuICAgIHRoaXMudXBkYXRlVXJsID0gdXBkYXRlVXJsO1xuICAgIHRoaXMub25TdWJtaXQgPSBbXTtcbiAgfVxuXG4gIGluaXQoKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgbGV0IGZvcm1zOiBhbnkgPSAkKHRoaXMuc2VsZWN0b3JGb3JtKTtcbiAgICBpZiAoZm9ybXMuY29uc3RydWN0b3IgIT09IEFycmF5KSBmb3JtcyA9IFtmb3Jtc107XG5cbiAgICBmb3IgKGxldCBmb3JtIG9mIGZvcm1zKSB7XG4gICAgICB0aGlzLnNldHVwRm9ybShmb3JtKTtcbiAgICB9XG4gIH1cblxuICBzZXR1cEZvcm0oZm9ybSkge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgJChmb3JtKVxuICAgICAgLm9mZihcInN1Ym1pdFwiKVxuICAgICAgLm9uKFwic3VibWl0XCIsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgbGV0IGZvcm06IGFueSA9ICQodGhpcyk7XG5cbiAgICAgICAgZm9yIChsZXQgc3VibWl0IG9mIHNlbGYub25TdWJtaXQpIHtcbiAgICAgICAgICBsZXQgcmVzdWx0ID0gc3VibWl0KGV2ZW50LCBmb3JtKTtcbiAgICAgICAgICBpZiAoIXJlc3VsdCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCEhZm9ybS5wYXJzbGV5KSB7XG4gICAgICAgICAgaWYgKCFmb3JtLnBhcnNsZXkoKS5pc1ZhbGlkIHx8ICFmb3JtLnBhcnNsZXkoKS5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgIGZvcm0ucGFyc2xleSgpLnZhbGlkYXRlKCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNlbGYuaXNMb2FkaW5nKSByZXR1cm4gdHJ1ZTtcblxuICAgICAgICBsZXQgdXJsID0gZm9ybS5hdHRyKFwiYWN0aW9uXCIpO1xuICAgICAgICBsZXQgZGF0YSA9IG5ldyBGb3JtRGF0YSg8YW55PiQodGhpcylbMF0pO1xuICAgICAgICBsZXQgZGF0YUFycmF5ID0gJCh0aGlzKS5zZXJpYWxpemVBcnJheSgpO1xuICAgICAgICBsZXQgbWV0aG9kID0gZm9ybS5hdHRyKFwibWV0aG9kXCIpO1xuXG4gICAgICAgIHNlbGYuZGlzYWJsZUZvcm0oZm9ybSk7XG4gICAgICAgIHNlbGYuaXNMb2FkaW5nID0gdHJ1ZTtcblxuICAgICAgICBpZiAoc2VsZi5jdXN0b21SZXF1ZXN0KSB7XG4gICAgICAgICAgc2VsZi5jdXN0b21SZXF1ZXN0KHVybCwgbWV0aG9kLCBkYXRhQXJyYXkpO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgICg8YW55PiQpLmFqYXgoe1xuICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxuICAgICAgICAgIGNvbnRlbnRUeXBlOiBmYWxzZSxcbiAgICAgICAgICBlbmN0eXBlOiBcIm11bHRpcGFydC9mb3JtLWRhdGFcIixcbiAgICAgICAgICBjb21wbGV0ZTogKHJlc3BvbnNlLCB4aHIsIHNldHRpbmdzKSA9PiB7XG4gICAgICAgICAgICBsZXQgcmVzcG9uc2VUZXh0ID0gcmVzcG9uc2UucmVzcG9uc2VUZXh0O1xuICAgICAgICAgICAgc2VsZi5pc0xvYWRpbmcgPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKHNlbGYudXBkYXRlVXJsICYmICghbWV0aG9kIHx8IG1ldGhvZC50b1VwcGVyQ2FzZSgpID09PSBcIkdFVFwiKSAmJiBoaXN0b3J5LnB1c2hTdGF0ZSkge1xuICAgICAgICAgICAgICB1cmwgPSBzZWxmLmdldEdldFVybCh1cmwsIGRhdGFBcnJheSk7XG4gICAgICAgICAgICAgIGhpc3RvcnkucHVzaFN0YXRlKCQucGpheC5zdGF0ZSwgZG9jdW1lbnQudGl0bGUsIHVybCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBzdGF0dXMgPSByZXNwb25zZS5zdGF0dXM7XG5cbiAgICAgICAgICAgIGlmIChzdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgICBzZWxmLnNob3dNZXNzYWdlKHJlc3BvbnNlVGV4dCwgXCJzdWNjZXNzXCIpO1xuICAgICAgICAgICAgICBpZiAoc2VsZi5lbmFibGVGb3JtT25TdWNjZXNzKSBzZWxmLmVuYWJsZUZvcm0oKTtcbiAgICAgICAgICAgICAgaWYgKCEhc2VsZi5vblN1Y2Nlc3MpIHNlbGYub25TdWNjZXNzKHJlc3BvbnNlLCBmb3JtKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RhdHVzID09PSAzMDEgfHwgc3RhdHVzID09PSAzMDIpIHtcbiAgICAgICAgICAgICAgc2VsZi5zaG93TWVzc2FnZShyZXNwb25zZVRleHQsIFwid2FybmluZ1wiKTtcbiAgICAgICAgICAgICAgaWYgKHNlbGYuZW5hYmxlRm9ybU9uU3VjY2Vzcykgc2VsZi5lbmFibGVGb3JtKCk7XG4gICAgICAgICAgICAgIGlmICghIXNlbGYub25SZWRpcmVjdCkgc2VsZi5vblJlZGlyZWN0KHJlc3BvbnNlLCBmb3JtKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNlbGYuc2hvd01lc3NhZ2UocmVzcG9uc2VUZXh0LCBcImRhbmdlclwiKTtcbiAgICAgICAgICAgICAgc2VsZi5lbmFibGVGb3JtKCk7XG4gICAgICAgICAgICAgIGlmICghIXNlbGYub25FcnJvcikgc2VsZi5vbkVycm9yKHJlc3BvbnNlLCBmb3JtKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9KTtcbiAgfVxuXG4gIGdldEdldFVybCh1cmwsIGRhdGFBcnJheSkge1xuICAgIGlmICh1cmwuaW5kZXhPZihcIj9cIikgPT09IHVybC5sZW5ndGggLSAxKSB1cmwgPSB1cmwuc3Vic3RyKDAsIHVybC5sZW5ndGggLSAxKTtcblxuICAgIGxldCBpbmRleCA9IDA7XG4gICAgZm9yIChsZXQgZGF0YUVudHJ5IG9mIGRhdGFBcnJheSkge1xuICAgICAgbGV0IGtleSA9IGRhdGFFbnRyeVtcIm5hbWVcIl07XG4gICAgICBsZXQgdmFsdWUgPSBlbmNvZGVVUklDb21wb25lbnQoZGF0YUVudHJ5W1widmFsdWVcIl0pO1xuXG4gICAgICBpZiAoIWtleSB8fCBrZXkgPT09IFwiYWpheFwiIHx8IGtleSA9PT0gXCJfY3NyZlwiIHx8IGtleSA9PT0gXCJwamF4XCIgfHwga2V5ID09PSBcIl9wamF4XCIpIGNvbnRpbnVlO1xuICAgICAgaWYgKGluZGV4ID09PSAwKSB1cmwgKz0gXCI/XCIgKyBrZXkgKyBcIj1cIiArIHZhbHVlO1xuICAgICAgZWxzZSB1cmwgKz0gXCImXCIgKyBrZXkgKyBcIj1cIiArIHZhbHVlO1xuICAgICAgaW5kZXgrKztcbiAgICB9XG5cbiAgICByZXR1cm4gdXJsO1xuICB9XG5cbiAgc2hvd01lc3NhZ2UodGV4dCwgdHlwZSkge1xuICAgIGlmICh0aGlzLm1lc3NhZ2VDb250YWluZXIubGVuZ3RoID09PSAwIHx8ICF0ZXh0IHx8IHRleHQubGVuZ3RoID09PSAwIHx8ICF0eXBlIHx8IHR5cGUubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgICBpZiAodGhpcy5pc1RleHRKc29uKHRleHQpKSB7XG4gICAgICBsZXQgdGV4dEpzb24gPSBKU09OLnBhcnNlKHRleHQpO1xuICAgICAgaWYgKCEhdGV4dEpzb25bXCJtc2dcIl0gJiYgdGV4dEpzb25bXCJtc2dcIl0ubGVuZ3RoID4gMCkge1xuICAgICAgICB0ZXh0ID0gdGV4dEpzb25bXCJtc2dcIl07XG4gICAgICB9XG5cbiAgICAgIC8vIFBhcnNlIGxpc3Qgb2YgZXJyb3JzXG4gICAgICBpZiAoISF0ZXh0SnNvblswXSAmJiAhIXRleHRKc29uWzBdLm1zZykge1xuICAgICAgICB0ZXh0ID0gXCJcIjtcbiAgICAgICAgZm9yIChsZXQgdGV4dEVudHJ5IG9mIHRleHRKc29uKSB7XG4gICAgICAgICAgaWYgKHRleHQubGVuZ3RoID4gMCkgdGV4dCArPSBcIjxici8+XCI7XG4gICAgICAgICAgdGV4dCArPSB0ZXh0RW50cnkubXNnO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IGh0bWwgPSBcIlwiO1xuXG4gICAgaWYgKHRoaXMuZGlzcGxheVJhd1Jlc3BvbnNlT25TdWNjZXNzICYmIHR5cGUgPT09IFwic3VjY2Vzc1wiKSB7XG4gICAgICBodG1sID0gdGV4dDtcbiAgICB9IGVsc2Uge1xuICAgICAgaHRtbCA9ICc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtJyArIHR5cGUgKyAnIGZhZGUgaW5cIj4nICsgJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGRhdGEtZGlzbWlzcz1cImFsZXJ0XCIgY2xhc3M9XCJjbG9zZVwiPjxpIGNsYXNzPVwiZmEgZmEtdGV4dCBmYS10aW1lcy1jaXJjbGUtb1wiPjwvaT48L2J1dHRvbj4nICsgdGV4dCArIFwiPC9kaXY+XCI7XG4gICAgfVxuXG4gICAgdGhpcy5tZXNzYWdlQ29udGFpbmVyLmh0bWwoaHRtbCk7XG4gIH1cblxuICBzZXRDdXN0b21SZXF1ZXN0KGN1c3RvbVJlcXVlc3Q6ICh1cmwsIG1ldGhvZCwgZGF0YUFycmF5KSA9PiB2b2lkKSB7XG4gICAgdGhpcy5jdXN0b21SZXF1ZXN0ID0gY3VzdG9tUmVxdWVzdDtcbiAgfVxuXG4gIHNldElzTG9hZGluZyhpc0xvYWRpbmc6IGJvb2xlYW4pIHtcbiAgICB0aGlzLmlzTG9hZGluZyA9IGlzTG9hZGluZztcbiAgfVxuXG4gIGVuYWJsZUZvcm0oKSB7XG4gICAgdGhpcy5mb3JtSW5wdXQuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICQodGhpcykucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5mb3JtVGV4dEFyZWEuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICQodGhpcykucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5mb3JtU2VsZWN0LmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAkKHRoaXMpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICB9KTtcblxuICAgIHRoaXMuZm9ybUJ1dHRvbi5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgJCh0aGlzKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIik7XG4gICAgfSk7XG5cbiAgICB0aGlzLmZvcm1MaW5rQWpheC5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgJCh0aGlzKS5hZGRDbGFzcyhcImFqYXhcIik7XG4gICAgfSk7XG5cbiAgICB0aGlzLmZvcm1MaW5rLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAkKHRoaXMpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKTtcbiAgICAgICQodGhpcykuYXR0cihcImhyZWZcIiwgXCJqYXZhc2NyaXB0OnZvaWQoMCk7XCIpO1xuXG4gICAgICBsZXQgbGluayA9ICQodGhpcykuYXR0cihcImxpbmtcIik7XG4gICAgICAkKHRoaXMpLmF0dHIoXCJocmVmXCIsIGxpbmspO1xuICAgICAgJCh0aGlzKS5yZW1vdmVBdHRyKFwibGlua1wiKTtcbiAgICB9KTtcblxuICAgIHRoaXMuZm9ybUJ1dHRvblNob3dMb2FkaW5nLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAkKHRoaXMpXG4gICAgICAgIC5maW5kKFwiLmFwcC1sb2FkZXItaW4tYnV0dG9uXCIpXG4gICAgICAgIC5yZW1vdmUoKTtcbiAgICB9KTtcbiAgfVxuXG4gIGRpc2FibGVGb3JtKGZvcm0pIHtcbiAgICB0aGlzLmZvcm1JbnB1dCA9ICQoXCJpbnB1dDpub3QoW2Rpc2FibGVkXSlcIiwgZm9ybSk7XG4gICAgdGhpcy5mb3JtVGV4dEFyZWEgPSAkKFwidGV4dGFyZWE6bm90KFtkaXNhYmxlZF0pXCIsIGZvcm0pO1xuICAgIHRoaXMuZm9ybVNlbGVjdCA9ICQoXCJzZWxlY3Q6bm90KFtkaXNhYmxlZF0pXCIsIGZvcm0pO1xuICAgIHRoaXMuZm9ybUJ1dHRvbiA9ICQoXCJidXR0b246bm90KFtkaXNhYmxlZF0pXCIsIGZvcm0pO1xuICAgIHRoaXMuZm9ybUxpbmtBamF4ID0gJChcImEuYWpheFwiLCBmb3JtKTtcbiAgICB0aGlzLmZvcm1MaW5rID0gJChcImE6bm90KFtkaXNhYmxlZF0pXCIsIGZvcm0pO1xuICAgIHRoaXMuZm9ybUJ1dHRvblNob3dMb2FkaW5nID0gJChcImJ1dHRvbi5hcHAtc2hvdy1sb2FkaW5nOnN1Ym1pdFwiLCBmb3JtKTtcblxuICAgIHRoaXMuZm9ybUlucHV0LmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAkKHRoaXMpLnByb3AoXCJkaXNhYmxlZFwiLCBcInRydWVcIik7XG4gICAgfSk7XG5cbiAgICB0aGlzLmZvcm1UZXh0QXJlYS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgJCh0aGlzKS5wcm9wKFwiZGlzYWJsZWRcIiwgXCJ0cnVlXCIpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5mb3JtU2VsZWN0LmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAkKHRoaXMpLnByb3AoXCJkaXNhYmxlZFwiLCBcInRydWVcIik7XG4gICAgfSk7XG5cbiAgICB0aGlzLmZvcm1CdXR0b24uZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICQodGhpcykucHJvcChcImRpc2FibGVkXCIsIFwidHJ1ZVwiKTtcbiAgICB9KTtcblxuICAgIHRoaXMuZm9ybUxpbmtBamF4LmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKFwiYWpheFwiKTtcbiAgICB9KTtcblxuICAgIHRoaXMuZm9ybUxpbmsuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICQodGhpcykuYXR0cihcImRpc2FibGVkXCIsIFwidHJ1ZVwiKTtcbiAgICAgIGxldCBsaW5rID0gJCh0aGlzKS5hdHRyKFwiaHJlZlwiKTtcbiAgICAgICQodGhpcykuYXR0cihcImxpbmtcIiwgbGluayk7XG4gICAgICAkKHRoaXMpLmF0dHIoXCJocmVmXCIsIFwiamF2YXNjcmlwdDp2b2lkKDApO1wiKTtcbiAgICB9KTtcblxuICAgIHRoaXMuZm9ybUJ1dHRvblNob3dMb2FkaW5nLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAkKHRoaXMpLmFwcGVuZChcIjxkaXYgY2xhc3M9J2FwcC1sb2FkZXItaW4tYnV0dG9uJz48L2Rpdj5cIik7XG4gICAgfSk7XG4gIH1cblxuICB2YWxpZGF0ZSgpIHtcbiAgICBsZXQgZm9ybTogYW55ID0gJCh0aGlzLnNlbGVjdG9yRm9ybSk7XG4gICAgbGV0IHBhcnNsZXkgPSBmb3JtLnBhcnNsZXkoKTtcbiAgICBpZiAoISFwYXJzbGV5KSBwYXJzbGV5LnZhbGlkYXRlKCk7XG4gIH1cblxuICBzZXRPblN1Ym1pdExpc3RlbmVyKG9uU3VibWl0OiAoZXZlbnQsIGZvcm0pID0+IHZvaWQpIHtcbiAgICB0aGlzLm9uU3VibWl0LnB1c2gob25TdWJtaXQpO1xuICB9XG5cbiAgc2V0T25TdWNjZXNzTGlzdGVuZXIob25TdWNjZXNzOiAocmVzcG9uc2UsIGZvcm0pID0+IHZvaWQpIHtcbiAgICB0aGlzLm9uU3VjY2VzcyA9IG9uU3VjY2VzcztcbiAgfVxuXG4gIHNldE9uUmVkaXJlY3RMaXN0ZW5lcihvblJlZGlyZWN0OiAocmVzcG9uc2UsIGZvcm0pID0+IHZvaWQpIHtcbiAgICB0aGlzLm9uUmVkaXJlY3QgPSBvblJlZGlyZWN0O1xuICB9XG5cbiAgc2V0T25FcnJvckxpc3RlbmVyKG9uRXJyb3I6IChyZXNwb25zZSwgZm9ybSkgPT4gdm9pZCkge1xuICAgIHRoaXMub25FcnJvciA9IG9uRXJyb3I7XG4gIH1cblxuICBpc1RleHRKc29uKHN0cikge1xuICAgIHRyeSB7XG4gICAgICBKU09OLnBhcnNlKHN0cik7XG4gICAgfSBjYXRjaCAoZXZlbnQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cbiJdfQ==

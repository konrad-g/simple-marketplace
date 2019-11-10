import { expect } from "chai";
import * as request from "supertest";
import { HtmlPaginator } from "../../src/server/elements/gui/paginator/HtmlPaginator";

describe("HtmlPaginator", function() {
  it("Should return HTML when there is only one page", function() {
    // Given paginator
    // When we create HTML version
    let paginator = new HtmlPaginator(1, 1, "https://test.com", []);
    let html: string = paginator.getHtml();

    // Then it consist of content
    expect(html).to.not.equal(null);
    expect(html).to.not.equal(undefined);
    expect(html.length).to.not.equal(0);
    expect(html).to.include('<a href="https://test.com?page=0" class="btn btn-default app-btn-paginator ajax  btn-main selected">1</a>');
  });
});

describe("database route", () => {
  it("keeps the mobile item list within the viewport after nav", () => {
    cy.viewport(390, 844);
    cy.visit("/");

    cy.get('button[aria-label="Site menu"]').click();
    cy.get('nav[aria-label="Mobile navigation"]')
      .contains("a", "Database")
      .click();

    cy.contains("Database Explorer").should("be.visible");
    cy.get('[aria-label="Database item results"]').then(($list) => {
      const rect = $list[0].getBoundingClientRect();

      expect(rect.left).to.be.at.least(0);
      expect(rect.right).to.be.at.most(Cypress.config("viewportWidth"));
    });
    cy.window().then((window) => {
      cy.contains(/\d+ results/).then(($results) => {
        const stats = $results.closest("section")[0];
        const rect = stats.getBoundingClientRect();

        expect(rect.top).to.be.at.least(0);
        expect(rect.bottom).to.be.at.most(window.innerHeight);
      });
    });
  });

  it("keeps the desktop item list footer visible after nav", () => {
    cy.viewport(1440, 900);
    cy.visit("/");

    cy.get('header nav[aria-label="Main navigation"]')
      .contains("a", "Database")
      .click();

    cy.contains("Database Explorer").should("be.visible");
    cy.window().then((window) => {
      cy.contains(/\d+ results/).then(($results) => {
        const stats = $results.closest("section")[0];
        const rect = stats.getBoundingClientRect();

        expect(rect.top).to.be.at.least(0);
        expect(rect.bottom).to.be.at.most(window.innerHeight);
      });
    });
  });
});

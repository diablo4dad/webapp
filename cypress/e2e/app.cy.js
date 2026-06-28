describe("app shell", () => {
  it("renders the root route and accepts a search term", () => {
    cy.viewport(1440, 900);
    cy.visit("/");

    cy.contains("Diablo IV").should("be.visible");
    cy.get('input[placeholder="Search transmogs"]')
      .filter(":visible")
      .first()
      .type("mount")
      .should("have.value", "mount");
  });
});

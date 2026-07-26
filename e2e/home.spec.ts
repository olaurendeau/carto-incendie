import { expect, test } from "@playwright/test";

test("la page d'accueil charge et propose de créer une zone", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Carto Incendie/ })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Créer une nouvelle zone d'incendie/ })
  ).toBeVisible();
});

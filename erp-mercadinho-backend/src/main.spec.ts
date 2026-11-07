import { getCorsOrigins } from "./main";

describe("getCorsOrigins", () => {
  it("uses local development origins when none are configured", () => {
    expect(getCorsOrigins({ NODE_ENV: "development" })).toContain(
      "http://localhost:5173",
    );
  });

  it("parses and deduplicates explicitly configured origins", () => {
    expect(
      getCorsOrigins({
        NODE_ENV: "production",
        CORS_ORIGINS: "https://erp.example.com, https://erp.example.com",
      }),
    ).toEqual(["https://erp.example.com"]);
  });

  it("requires HTTPS origins in production", () => {
    expect(() =>
      getCorsOrigins({
        NODE_ENV: "production",
        CORS_ORIGINS: "http://erp.example.com",
      }),
    ).toThrow("em produção use HTTPS");
  });

  it("requires an explicit frontend origin in production", () => {
    expect(() => getCorsOrigins({ NODE_ENV: "production" })).toThrow(
      "Configure CORS_ORIGINS",
    );
  });
});

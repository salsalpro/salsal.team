import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  testDatabase,
  createTestSchema,
  dropTestSchema,
} from "../scripts/test-database";
import { migrateDomain, query, closeDb } from "../src/lib/db";
import {
  createBlogPost,
  updateBlogPost,
  getBlogPost,
  listBlogPosts,
  deleteBlogPost,
} from "../src/lib/repository";
import { blogSchema } from "../src/lib/validation";
import {
  articleDetailsSchema,
  detectArticleLanguage,
  readingMinutes,
  richDocumentSchema,
  type ArticleNode,
} from "../src/lib/article-content";
const database = testDatabase("cms");
process.env.DATABASE_URL = database.url;
process.env.BETTER_AUTH_SECRET = randomBytes(48).toString("hex");
process.env.BETTER_AUTH_URL = "http://localhost:3000";
let adminCookie = "",
  userCookie = "";
before(async () => {
  await createTestSchema(database.schema);
  const { auth } = await import("../src/lib/auth");
  const { getMigrations } = await import("better-auth/db/migration");
  await (await getMigrations(auth.options)).runMigrations();
  // Prove expansion preserves real legacy-shaped records byte for byte.
  await query(readFileSync("migrations/001-domain.sql", "utf8"));
  await query(
    "CREATE TABLE schema_migration(version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)",
  );
  await query("INSERT INTO schema_migration VALUES ('001-domain.sql',$1)", [
    new Date().toISOString(),
  ]);
  const localized = JSON.stringify({
    en: "Original English",
    fa: "متن اصلی فارسی",
  });
  await query(
    "INSERT INTO blog_post(id,slug,title,excerpt,content,category,author,published,published_at,seo_title,seo_description,created_at,updated_at) VALUES ('legacy','legacy-article',$1,$1,$1,$1,'Original author',1,$2,$1,$1,$2,$2)",
    [localized, new Date().toISOString()],
  );
  const before = (
    await query(
      "SELECT title,content,slug,published_at FROM blog_post WHERE id='legacy'",
    )
  ).rows[0];
  await migrateDomain();
  assert.deepEqual(
    (
      await query(
        "SELECT title,content,slug,published_at FROM blog_post WHERE id='legacy'",
      )
    ).rows[0],
    before,
  );
  for (const role of ["ADMIN", "USER"]) {
    const body = {
      name: role,
      email: `${role.toLowerCase()}@cms.test`,
      password: "CmsTestPassword2026!",
    };
    const account = await auth.api.signUpEmail({ body });
    if (role === "ADMIN")
      await query('UPDATE "user" SET role=$1 WHERE id=$2', [
        role,
        account.user.id,
      ]);
    const response = await auth.api.signInEmail({ body, asResponse: true });
    const cookie = response.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");
    if (role === "ADMIN") adminCookie = cookie;
    else userCookie = cookie;
  }
});
after(async () => {
  await closeDb();
  await dropTestSchema(database.schema);
});
const rich = (text: string): ArticleNode => ({
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text }] },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "A strong link",
          marks: [
            { type: "bold" },
            { type: "link", attrs: { href: "/en/blog", title: null } },
          ],
        },
      ],
    },
    {
      type: "blockquote",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Quote" }] },
      ],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "List" }] },
          ],
        },
      ],
    },
    {
      type: "codeBlock",
      attrs: { language: "js" },
      content: [{ type: "text", text: "const x = '<script>';" }],
    },
    {
      type: "table",
      content: [
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              attrs: { colspan: 1, rowspan: 1, colwidth: null },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Cell" }],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "image",
      attrs: {
        src: "/images/test.webp",
        alt: "Accessible image",
        caption: "Preserved caption",
      },
    },
  ],
});
function input(language: "en" | "fa", slug = "shared-slug") {
  const title =
    language === "en" ? "English CMS article" : "مقاله کامل فارسی برای آزمایش";
  const localized = { en: "", fa: "", [language]: title };
  return blogSchema.parse({
    slug,
    title: localized,
    excerpt: localized,
    content: localized,
    category: { en: "", fa: "", [language]: "Strategy" },
    author: "Existing author",
    primaryLanguage: language,
    cover: "/images/test.webp",
    seoTitle: localized,
    seoDescription: localized,
    editorial: {
      languageMode: "manual",
      [language]: articleDetailsSchema.parse({
        document: rich(title),
        tags: ["SEO", "Growth"],
        coverAlt: "Cover alternative",
        coverCaption: "Cover caption",
        focusKeyphrase: "CMS",
        secondaryKeyphrases: ["SEO"],
        canonical: "https://salsal.team/" + language + "/blog/" + slug,
        ogTitle: "Social headline",
        ogDescription: "Social description",
        ogImage: "/images/test.webp",
        twitterTitle: "X headline",
        twitterDescription: "X description",
        twitterImage: "/images/test.webp",
      }),
    },
  });
}
test("create/save/reload/edit/save/reload both primary languages and every editorial field", async () => {
  for (const language of ["en", "fa"] as const) {
    const submitted = input(language);
    const post = await createBlogPost(submitted);
    const reloaded = (await getBlogPost(post.id))!;
    assert.deepEqual(reloaded.editorial, submitted.editorial);
    for (const field of [
      "title",
      "slug",
      "excerpt",
      "category",
      "author",
      "cover",
      "seoTitle",
      "seoDescription",
    ] as const)
      assert.deepEqual(
        reloaded[field],
        submitted[field],
        `Persist ${field} in ${language}`,
      );
    assert.equal(reloaded.primaryLanguage, language);
    assert.equal(
      await getBlogPost(post.slug, { publishedOnly: true, language }),
      null,
    );
    const old = reloaded.updatedAt;
    const updated = (await updateBlogPost(post.id, {
      published: true,
      expectedUpdatedAt: old,
      editorial: {
        ...reloaded.editorial,
        [language]: {
          ...reloaded.editorial[language]!,
          focusKeyphrase: "Updated phrase",
          noindex: true,
          sitemap: false,
        },
      },
    }))!;
    const fresh = (await getBlogPost(post.slug, {
      publishedOnly: true,
      language,
    }))!;
    assert.deepEqual(fresh, updated);
    assert.equal(fresh.editorial[language]?.focusKeyphrase, "Updated phrase");
    assert.equal(
      fresh.editorial[language]?.document?.content?.[5].type,
      "table",
    );
    await assert.rejects(
      updateBlogPost(post.id, {
        author: "Stale author",
        expectedUpdatedAt: old,
      }),
      /another session/,
    );
    const publication = fresh.publishedAt;
    await updateBlogPost(post.id, { published: false });
    assert.equal(
      await getBlogPost(post.slug, { publishedOnly: true, language }),
      null,
    );
    assert.equal((await getBlogPost(post.id))?.publishedAt, publication);
    await updateBlogPost(post.id, { published: true });
    assert.equal((await getBlogPost(post.id))?.publishedAt, publication);
  }
});
test("locale slug uniqueness and legacy bilingual URL occupancy", async () => {
  await assert.rejects(createBlogPost(input("en")), { code: "23505" });
  await assert.rejects(createBlogPost(input("fa", "legacy-article")), {
    code: "23505",
  });
  assert.equal(
    (
      await getBlogPost("legacy-article", {
        publishedOnly: true,
        language: "en",
      })
    )?.id,
    "legacy",
  );
  assert.equal(
    (
      await getBlogPost("legacy-article", {
        publishedOnly: true,
        language: "fa",
      })
    )?.id,
    "legacy",
  );
  const legacy = (await getBlogPost("legacy"))!;
  await updateBlogPost("legacy", {
    title: { ...legacy.title, en: "Edited English only" },
  });
  assert.equal((await getBlogPost("legacy"))?.content.fa, "متن اصلی فارسی");
  await assert.rejects(
    updateBlogPost("legacy", { primaryLanguage: "en" }),
    /both language versions/,
  );
  const en = await createBlogPost(input("en", "english-only"));
  await updateBlogPost(en.id, { published: true });
  assert.equal(
    await getBlogPost(en.slug, { publishedOnly: true, language: "fa" }),
    null,
  );
  assert.ok(
    (await listBlogPosts({ language: "fa" })).every(
      (p) => !p.primaryLanguage || p.primaryLanguage === "fa",
    ),
  );
  await deleteBlogPost(en.id);
  assert.equal(await getBlogPost(en.id), null);
});
test("language detection, manual override model and reading time use readable prose", () => {
  assert.equal(detectArticleLanguage("استراتژی SEO برای رشد پایدار"), "fa");
  assert.equal(detectArticleLanguage("English writing and growth"), "en");
  assert.equal(detectArticleLanguage("123"), null);
  assert.equal(readingMinutes(Array(221).fill("word").join(" "), "en"), 2);
  assert.equal(readingMinutes(Array(181).fill("واژه").join(" "), "fa"), 2);
});
test("strict document and metadata validation prevent HTML/URL/mass-assignment payloads", () => {
  for (const document of [
    { type: "doc", content: [{ type: "script", text: "alert(1)" }] },
    {
      type: "doc",
      content: [
        {
          type: "image",
          attrs: { src: "data:image/svg+xml,<svg onload=alert(1)>" },
        },
      ],
    },
    {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "X",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
      ],
    },
    {
      type: "doc",
      content: [{ type: "paragraph", attrs: { onclick: "alert(1)" } }],
    },
  ])
    assert.equal(richDocumentSchema.safeParse(document).success, false);
  assert.equal(
    articleDetailsSchema.safeParse({ canonical: "javascript:alert(1)" })
      .success,
    false,
  );
  assert.equal(
    blogSchema.safeParse({ ...input("en"), role: "ADMIN" }).success,
    false,
  );
});
test("blog APIs enforce admin role and origin for create/edit/delete", async () => {
  const { POST } = await import("../src/app/api/admin/blog/route");
  const { PATCH, DELETE } =
    await import("../src/app/api/admin/blog/[id]/route");
  const req = (
    cookie: string,
    body = input("en", "api-article"),
    method = "POST",
    origin = "http://localhost:3000",
  ) =>
    new Request("http://localhost:3000/api/admin/blog", {
      method,
      headers: { cookie, origin, "content-type": "application/json" },
      body: method === "DELETE" ? undefined : JSON.stringify(body),
    });
  assert.equal((await POST(req(""))).status, 401);
  assert.equal((await POST(req(userCookie))).status, 403);
  assert.equal(
    (await POST(req(adminCookie, undefined, "POST", "https://attacker.test")))
      .status,
    403,
  );
  const response = await POST(req(adminCookie));
  assert.equal(response.status, 201);
  const { post } = await response.json();
  const duplicate = await POST(req(adminCookie));
  assert.equal(duplicate.status, 409);
  assert.match(
    (await duplicate.json()).error,
    /already exists in this language/,
  );
  const ctx = { params: Promise.resolve({ id: post.id }) };
  assert.equal(
    (await PATCH(req(userCookie, undefined, "PATCH"), ctx)).status,
    403,
  );
  assert.equal(
    (await DELETE(req(userCookie, undefined, "DELETE"), ctx)).status,
    403,
  );
  assert.equal(
    (await DELETE(req(adminCookie, undefined, "DELETE"), ctx)).status,
    200,
  );
});

test("private image uploads validate actual pixels and deny unauthorized or oversized input", async () => {
  const sharp = (await import("sharp")).default;
  const { prepareArticleImage } = await import("../src/lib/article-upload");
  const { POST } = await import("../src/app/api/admin/blog/images/route");
  const image = await sharp({
    create: { width: 10, height: 10, channels: 3, background: "red" },
  })
    .png()
    .toBuffer();
  const valid = new File([new Uint8Array(image)], "unsafe-name.html", {
    type: "image/png",
  });
  const encoded = await prepareArticleImage(valid);
  assert.equal((await sharp(encoded).metadata()).format, "webp");
  await assert.rejects(
    prepareArticleImage(
      new File(["<svg onload='alert(1)'>"], "fake.png", { type: "image/png" }),
    ),
    /not a supported/,
  );
  await assert.rejects(
    prepareArticleImage(
      new File(["<svg/>"], "image.svg", { type: "image/svg+xml" }),
    ),
    /PNG, JPEG or WebP/,
  );
  await assert.rejects(
    prepareArticleImage(
      new File([new Uint8Array(2 * 1024 * 1024 + 1)], "big.png", {
        type: "image/png",
      }),
    ),
    /2 MB/,
  );
  const req = (cookie: string, file = valid) => {
    const data = new FormData();
    data.set("file", file);
    return new Request("http://localhost:3000/api/admin/blog/images", {
      method: "POST",
      headers: { cookie, origin: "http://localhost:3000" },
      body: data,
    });
  };
  assert.equal((await POST(req(""))).status, 401);
  assert.equal((await POST(req(userCookie))).status, 403);
  assert.equal(
    (
      await POST(
        req(
          adminCookie,
          new File(["invalid"], "fake.png", { type: "image/png" }),
        ),
      )
    ).status,
    400,
  );
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.BLOB_READ_WRITE_TOKEN;
  try {
    assert.equal((await POST(req(adminCookie))).status, 503);
  } finally {
    if (token) process.env.BLOB_READ_WRITE_TOKEN = token;
  }
});
test("draft media stays private; only actual published references authorize retrieval", async () => {
  const { isPublishedArticleImage } = await import("../src/lib/repository");
  const { GET } = await import("../src/app/api/blog-images/[id]/route");
  const id = "b00a1487-1831-4aae-bb1f-018751d0cf92";
  const src = `/api/blog-images/${id}`;
  await query("INSERT INTO blog_image VALUES ($1,$2,'image/webp',$3)", [
    id,
    `articles/${id}.webp`,
    new Date().toISOString(),
  ]);
  const post = await createBlogPost({
    ...input("en", "private-media"),
    cover: src,
  });
  assert.equal(await isPublishedArticleImage(src), false);
  const response = await GET(new Request(`http://localhost:3000${src}`), {
    params: Promise.resolve({ id }),
  });
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  await updateBlogPost(post.id, { published: true });
  assert.equal(await isPublishedArticleImage(src), true);
  await updateBlogPost(post.id, { published: false });
  assert.equal(await isPublishedArticleImage(src), false);
  await deleteBlogPost(post.id);
  assert.equal(
    (await query("SELECT id FROM blog_image WHERE id=$1", [id])).rowCount,
    1,
    "reference removal must not delete objects",
  );
  await assert.rejects(
    createBlogPost({
      ...input("en", "invalid-image-reference"),
      cover: "/api/blog-images/00000000-0000-0000-0000-000000000000",
    }),
    /unavailable/,
  );
});
test("article metadata, structured data and sitemap use saved language and indexing settings", async () => {
  const {
    articleMetadata,
    articleStructuredData,
    articleSitemap,
    effectiveArticleSeo,
  } = await import("../src/lib/article-seo");
  const post = await createBlogPost(input("fa", "metadata-fa"));
  await updateBlogPost(post.id, { published: true });
  const fresh = (await getBlogPost(post.id))!;
  const metadata = articleMetadata(fresh, "fa", "https://salsal.team");
  assert.equal(metadata.title, fresh.seoTitle.fa);
  assert.deepEqual(metadata.alternates?.languages, {
    fa: "https://salsal.team/fa/blog/metadata-fa",
  });
  assert.equal(
    metadata.openGraph &&
      "title" in metadata.openGraph &&
      metadata.openGraph.title,
    "Social headline",
  );
  assert.equal(metadata.twitter?.title, "X headline");
  const ld = articleStructuredData(fresh, "fa", "https://salsal.team");
  assert.equal(ld.inLanguage, "fa");
  assert.equal(ld.datePublished, fresh.publishedAt);
  assert.equal(ld.dateModified, fresh.updatedAt);
  assert.equal(articleSitemap([fresh], "https://salsal.team").length, 1);
  const noindex = {
    ...fresh,
    editorial: {
      ...fresh.editorial,
      fa: { ...fresh.editorial.fa!, noindex: true },
    },
  };
  assert.equal(articleSitemap([noindex], "https://salsal.team").length, 0);
  assert.equal(
    articleSitemap([{ ...fresh, published: false }], "https://salsal.team")
      .length,
    0,
  );
  const externalCanonical = {
    ...fresh,
    editorial: {
      ...fresh.editorial,
      fa: {
        ...fresh.editorial.fa!,
        canonical: "https://example.test/original",
      },
    },
  };
  assert.equal(
    effectiveArticleSeo(externalCanonical, "fa", "https://salsal.team")
      .canonical,
    "https://example.test/original",
  );
  assert.equal(
    articleSitemap([externalCanonical], "https://salsal.team").length,
    0,
  );
});
test("safe public renderer escapes scripts and preserves semantic rich formatting", async () => {
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { ArticleBody } = await import("../src/components/public/article-body");
  const html = renderToStaticMarkup(
    createElement(ArticleBody, { document: rich("Rich article"), text: "" }),
  );
  assert.ok(html.includes("<table>"));
  assert.ok(html.includes("<blockquote>"));
  assert.ok(html.includes("<strong>"));
  assert.ok(html.includes("<figcaption>Preserved caption</figcaption>"));
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
  const legacy = renderToStaticMarkup(
    createElement(ArticleBody, {
      text: "## Heading\n\n<script>alert(1)</script>",
    }),
  );
  assert.ok(legacy.includes("<h2"));
  assert.ok(!legacy.includes("<script>"));
});

import { defineConfig } from "tinacms";

// Your hosting provider likely exposes this as an environment variable
const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

export default defineConfig({
  branch,

  // Get this from tina.io
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  // Get this from tina.io
  token: process.env.TINA_TOKEN,

  build: {
    outputFolder: "admin",
    publicFolder: "public", // change to "images" or "." if that matches your assets setup
  },
  media: {
    tina: {
      mediaRoot: "",
      publicFolder: "public", // also change here if not using "public"
    },
  },
  schema: {
    collections: [
      {
        name: "experience",
        label: "Experience",
        path: "content/experience",
        fields: [
          {
            type: "string",
            name: "position",
            label: "Position",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "company",
            label: "Company",
          },
          {
            type: "string",
            name: "years",
            label: "Years",
          },
          {
            type: "string",
            name: "description",
            label: "Description",
          },
        ],
      },
    ],
  },
});

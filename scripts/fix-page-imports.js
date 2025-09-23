import fs from "fs";
import path from "path";

const srcDir = path.resolve("./src");

// Map of flat page filenames → their nested replacements
const replacements = {
  "CoursesPage": "pages/courses/CoursesPage",
  "BlogPage": "pages/blog/BlogPage",
  "EventsPage": "pages/events/EventsPage",
  "ServicesPage": "pages/services/ServicesPage",
  "PricingPage": "pages/pricing/PricingPage",
  "DashboardPage": "pages/dashboard/DashboardPage",
};

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walk(filepath, callback);
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      callback(filepath);
    }
  });
}

// Step 1: Fix imports across the project
walk(srcDir, filepath => {
  let content = fs.readFileSync(filepath, "utf8");
  let changed = false;

  for (const [flatName, nestedPath] of Object.entries(replacements)) {
    const regex = new RegExp(`from ["']@/pages/${flatName}["']`, "g");
    if (regex.test(content)) {
      content = content.replace(regex, `from "@/${nestedPath}"`);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filepath, content, "utf8");
    console.log(`✅ Updated imports in: ${filepath}`);
  }
});

// Step 2: Delete flat duplicate pages
Object.keys(replacements).forEach(flatName => {
  const flatPath = path.join(srcDir, "pages", `${flatName}.tsx`);
  if (fs.existsSync(flatPath)) {
    fs.unlinkSync(flatPath);
    console.log(`🗑️ Deleted duplicate file: ${flatPath}`);
  }
});

console.log("🎉 Done! Imports fixed and duplicates removed.");

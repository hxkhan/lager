## Technical Info

### Project layout
```bash
/backend   # Spring Boot (Java 21)
  └─ src/main/resources/static   # (Build Artifact)
/frontend  # Svelte (Vite)
```

The frontend is served by the Spring Boot backend via its static resources. However `backend/src/main/resources/static/` is git-ignored becuase I treat the frontend like a build-artifact.

### Dependencies
1. Node.js ≥ 22.12 (for `npm` & the fronted)
2. Java SDK 21
3. Maven 3.9+ (or use the VS Code Extension Pack)
4. VS Code (optional, but helps massively):
    - `Extension Pack for Java` (includes maven)
    - `Spring Boot Extension Pack`

### Build the frontend
```bash
cd frontend
npm ci        # install dependencies
npm run build # this will build into `backend/src/main/resources/static/`
```

### Steps to run in VS Code
- Open `backend/src/main/java/lager/demo/Application.java` in VSC
- Click the play button at the top right
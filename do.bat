
if [%1]==[pub] (
  npx ts-node scripts\publish.ts %*
)

if [%1]==[docs] (
  typedoc --out docs src/code --readme README.md
)


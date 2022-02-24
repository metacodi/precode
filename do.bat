
if [%1]==[pub] (
  npx ts-node precode\publish.ts %*
)

if [%1]==[docs] (
  typedoc --out docs src/code --readme README.md
)


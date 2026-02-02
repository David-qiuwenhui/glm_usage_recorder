const { Composio } = require("@composio/core");

async function test() {
  const composio = new Composio();

  try {
    console.log("正在连接 Composio API...\n");
    let result = await composio.tools.getRawComposioTools();

    console.log("✓ API 连接成功！");

    if (Array.isArray(result)) {
      const toolCount = result.length;
      console.log("✓ 可用工具数量:", toolCount);
      console.log("");

      // 统计应用 - 立即处理并释放原始数据的大部分引用
      const appCount = {};
      while (result.length > 0) {
        const t = result.pop(); // 从末尾取出一个，减少数组大小并允许 GC 回收单个对象
        const app = (t.app || t.appName || "unknown").toLowerCase();
        appCount[app] = (appCount[app] || 0) + 1;
      }
      result = null; // 显式置空，帮助 GC

      console.log("热门应用 (按工具数量):");
      const popular = ['gmail', 'slack', 'github', 'notion', 'discord', 'jira', 'linear', 'hubspot', 'trello', 'asana'];
      popular.forEach(p => {
        const count = Object.entries(appCount).find(([k]) => k.includes(p));
        if (count) {
          console.log(`  ✓ ${count[0]}: ${count[1]} 个工具`);
        }
      });
    } else {
      console.log("结果:", typeof result);
    }

  } catch (e) {
    console.log("✗ 连接失败:", e.message);
    if (e.cause) console.log("  原因:", e.cause.message);
  }
}

test();

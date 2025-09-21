
/**
 * 思源笔记数据库工具类
 * 提供绑定块到数据库的相关操作
 */
class SiyuanAVHelper {
  avBlockId: any;
  avId: string;
  version: string;
  /**
   * 构造函数
   * @param {string} avBlockId 数据库块ID
   */
  constructor(avBlockId) {
    this.avBlockId = avBlockId;
    this.avId = "";
    this.version = "";
    // 注意：不在构造函数中调用_init()
  }

  /**
   * 初始化版本号和数据库ID
   * @private
   */
  async _init() {
    try {
      // 获取版本号
      const versionResult = await this._requestApi("/api/system/version");
      this.version = versionResult?.data || "";

      // 获取数据库ID
      const av = await this.getAvBySql(
        `SELECT * FROM blocks where type ='av' and id='${this.avBlockId}'`
      );
      if (av.length > 0) {
        this.avId =
          av.map((av) => this._getDataAvIdFromHtml(av.markdown))[0] || "";
      }
      // console.log(this.avId);
    } catch (error) {
      console.error("初始化失败:", error);
    }
  }

  /**
   * 绑定块到数据库
   * @param {string|Array<string>} blockIds 要绑定的块ID或ID数组
   * @returns {Promise<void>}
   */
  async addBlocks(blockIds) {
    if (!this.avId) {
      console.error("数据库ID未初始化，请检查数据库块ID配置是否正确");
      return;
    }

    blockIds = typeof blockIds === "string" ? [blockIds] : blockIds;
    const srcs = blockIds.map((blockId) => ({
      id: blockId,
      itemID: this._getRowIdByBlockId(blockId),
      isDetached: false,
    }));

    const input = {
      avID: this.avId,
      blockID: this.avBlockId,
      srcs: srcs,
    };

    const result = await this._requestApi(
      "/api/av/addAttributeViewBlocks",
      input
    );
    if (!result || result.code !== 0) console.error(result);
  }

  /**
   * 为已绑定的块添加数据库属性
   * @param {string|Array<string>} blockIds 块ID或ID数组
   * @param {Array<Object>} cols 列配置数组
   * @returns {Promise<void>}
   */
  async addCols(blockIds, cols) {
    if (!this.avId) {
      console.error("数据库ID未初始化，请检查数据库块ID配置是否正确");
      return;
    }

    blockIds = typeof blockIds === "string" ? [blockIds] : blockIds;
    for (const blockId of blockIds) {
      for (const col of cols) {
        if (!col.keyID) continue;
        const cellID = await this._getCellIdByRowIdAndKeyId(
          blockId,
          col.keyID,
          this.avId
        );
        if (!cellID) continue;
        let colData = {
          avID: this.avId,
          keyID: col.keyID,
          rowID: this._getRowIdByBlockId(blockId),
          cellID,
        };

        if (typeof col.getColValue !== "function") continue;
        const colValue = await col.getColValue(
          col.keyID,
          blockId,
          this._getRowIdByBlockId(blockId),
          cellID,
          this.avId
        );

        if (typeof colValue !== "object") continue;
        colData.value = colValue;

        const result = await this._requestApi(
          "/api/av/setAttributeViewBlockAttr",
          colData
        );
        if (!result || result.code !== 0) console.error(result);
      }
    }
  }

  /**
   * 添加非绑定块到数据库
   * @param {Array<HTMLElement>} blocks 块元素数组
   * @param {string} pkKeyID 主键列ID
   * @param {string} keyID 文本列ID
   * @param {Array<Object>} otherCols 其他列配置
   * @returns {Promise<void>}
   */
  async addBlocksNoBind(blocks, pkKeyID, keyID, otherCols) {
    if (!this.avId) {
      console.error("数据库ID未初始化，请检查数据库块ID配置是否正确");
      return;
    }

    const values = await Promise.all(
      [...blocks].map(async (block) => {
        const rowValues = [
          {
            keyID: pkKeyID,
            block: {
              content: keyID ? "" : block.textContent,
            },
          },
        ];

        if (keyID) {
          rowValues.push({
            keyID: keyID,
            text: {
              content: block.textContent,
            },
          });
        }

        if (otherCols && otherCols.length > 0) {
          for (const col of otherCols) {
            if (!col.keyID) continue;
            let colData = { keyID: col.keyID };
            if (typeof col.getColValue !== "function") continue;
            const colValue = await col.getColValue(col.keyID);
            if (typeof colValue !== "object") continue;
            colData = { ...colData, ...colValue };
            rowValues.push(colData);
          }
        }
        return rowValues;
      })
    );

    const input = {
      avID: this.avId,
      blocksValues: values,
    };

    const result = await this._requestApi(
      "/api/av/appendAttributeViewDetachedBlocksWithValues",
      input
    );
    if (!result || result.code !== 0) console.error(result);
  }

  /**
   * 设置块自定义属性
   * @param {string|Array<string>} blockIds 块ID或ID数组
   * @param {Object} attrs 属性对象
   * @returns {Promise<void>}
   */
  async setBlocksAttrs(blockIds, attrs) {
    if (typeof attrs !== "object") return;
    blockIds = typeof blockIds === "string" ? [blockIds] : blockIds;

    for (const blockId of blockIds) {
      if (!blockId) continue;
      const result = await this._requestApi("/api/attr/setBlockAttrs", {
        id: blockId,
        attrs: attrs,
      });
      if (!result || result.code !== 0) console.error(result);
    }
  }

  /**
   * 获取数据库列信息
   * @returns {Promise<Array>} 列信息数组
   */
  async getColumns() {
    if (!this.avId) {
      console.error("数据库ID未初始化，请检查数据库块ID配置是否正确");
      return [];
    }

    const result = await this._requestApi(
      "/api/av/getAttributeViewKeysByAvID",
      { avID: this.avId }
    );
    return result?.data || [];
  }

  /**
   * 执行SQL查询
   * @param {string} sql SQL语句
   * @returns {Promise<Array>} 查询结果
   */
  async getAvBySql(sql) {
    const result = await this._requestApi("/api/query/sql", { stmt: sql });
    console.log(result);
    if (result.code !== 0) {
      console.error("查询数据库出错", result.msg);
      return [];
    }
    return result.data;
  }

  // ============== 私有方法 ==============

  /**
   * 从HTML中提取数据库ID
   * @param {string} htmlString HTML字符串
   * @returns {string} 数据库ID
   * @private
   */
  _getDataAvIdFromHtml(htmlString) {
    // 使用正则表达式匹配data-av-id的值
    const match = htmlString.match(/data-av-id="([^"]+)"/);
    if (match && match[1]) {
      return match[1]; // 返回匹配的值
    }
    return ""; // 如果没有找到匹配项，则返回空
  }

  /**
   * 根据块ID生成行ID
   * @param {string} blockId 块ID
   * @returns {string} 行ID
   * @private
   */
  _getRowIdByBlockId(blockId) {
    if (this._compareVersions(this.version, "3.3.0") < 0) return blockId;
    const dashIndex = blockId.indexOf("-");
    const prefix = blockId.slice(0, dashIndex + 1);
    const suffix = blockId.slice(dashIndex + 1);
    const reversedSuffix = suffix.split("").reverse().join("");
    return prefix + reversedSuffix;
  }

  /**
   * 获取单元格ID
   * @param {string} rowId 行ID
   * @param {string} keyId 列ID
   * @param {string} avId 数据库ID
   * @returns {Promise<string>} 单元格ID
   * @private
   */
  async _getCellIdByRowIdAndKeyId(rowId, keyId, avId) {
    let res = await this._requestApi("/api/av/getAttributeViewKeys", {
      id: rowId,
    });
    const foundItem = res.data.find((item) => item.avID === avId);
    if (foundItem && foundItem.keyValues) {
      const specificKey = foundItem.keyValues.find((kv) => kv.key.id === keyId);
      if (specificKey && specificKey.values && specificKey.values.length > 0) {
        return specificKey.values[0].id;
      }
    }
  }

  /**
   * 发送API请求
   * @param {string} url API地址
   * @param {Object} data 请求数据
   * @param {string} method 请求方法
   * @returns {Promise<Object>} 响应结果
   * @private
   */
  async _requestApi(url, data, method = "POST") {
    // 主要用于浏览器测试
    if (window.siyuan.isPublish) {
      return await (
        await fetch(`http://localhost:6806${url}`, {
          method: method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token r5uswieah9xsefq2`,
          },
          body: JSON.stringify(data || {}),
        })
      ).json();
    } else {
      return await (
        await fetch(`${url}`, {
          method: method,
          body: JSON.stringify(data || {}),
        })
      ).json();
    }
  }

  /**
   * 比较版本号
   * @param {string} version1 版本1
   * @param {string} version2 版本2
   * @returns {number} 比较结果
   * @private
   */
  _compareVersions(version1, version2) {
    const v1 = version1.split(".");
    const v2 = version2.split(".");
    const len = Math.max(v1.length, v2.length);

    for (let i = 0; i < len; i++) {
      const num1 = i < v1.length ? parseInt(v1[i], 10) : 0;
      const num2 = i < v2.length ? parseInt(v2[i], 10) : 0;
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  }
}

/**
 * 创建思源笔记数据库工具实例
 * @param {string} avBlockId 数据库块ID
 * @returns {Promise<SiyuanAVHelper>} 返回初始化的工具实例
 */
export async function createSiyuanAVHelper(avBlockId) {
  const instance = new SiyuanAVHelper(avBlockId);
  await instance._init();
  return instance;
}

// 使用示例
// const avHelper = new SiyuanAVHelper('20250722192541-srot36c');
// await avHelper.addBlocks(['blockId1', 'blockId2']);
// await avHelper.addCols(['blockId1'], [{keyID: 'xxx', getColValue: () => ({...})}]);

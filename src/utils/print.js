// utils/print.js
/**
 * 打印工具函数
 */

/**
 * 打印表格数据
 * @param {Array} data - 表格数据
 * @param {Array} columns - 列定义
 * @param {string} title - 打印标题
 */
export function printTable(data, columns, title = '数据表格') {
  if (!data || !columns) {
    console.error('缺少打印数据或列定义');
    return;
  }

  // 生成表格HTML
  let tableHTML = `<h2 style="text-align: center;">${title}</h2>`;
  tableHTML += '<table style="width: 100%; border-collapse: collapse; font-size: 12px;">';

  // 生成表头
  tableHTML += '<thead><tr style="background-color: #f5f7fa;">';
  columns.forEach(column => {
    tableHTML += `<th style="border: 1px solid #000; padding: 8px; text-align: left; font-weight: bold;">${column.label || column.prop}</th>`;
  });
  tableHTML += '</tr></thead>';

  // 生成表体
  tableHTML += '<tbody>';
  data.forEach(row => {
    tableHTML += '<tr>';
    columns.forEach(column => {
      let cellValue = '';
      if (column.formatter && typeof column.formatter === 'function') {
        cellValue = column.formatter(row);
      } else {
        // 支持嵌套属性，如 'Account.name'
        if (column.prop && column.prop.includes('.')) {
          const props = column.prop.split('.');
          let value = row;
          for (const prop of props) {
            value = value ? value[prop] : '-';
          }
          cellValue = value || '-';
        } else {
          cellValue = (column.prop ? (row[column.prop] || '-') : '-');
        }
      }
      tableHTML += `<td style="border: 1px solid #000; padding: 6px; word-wrap: break-word;">${cellValue}</td>`;
    });
    tableHTML += '</tr>';
  });
  tableHTML += '</tbody></table>';

  // 打印窗口内容
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('无法打开打印窗口，请检查浏览器弹窗设置');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <meta charset="UTF-8">
      <style>
        body {
          margin: 20px;
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }

        th, td {
          border: 1px solid #000;
          padding: 6px 8px;
          text-align: left;
          vertical-align: top;
        }

        th {
          background-color: #f5f7fa;
          font-weight: bold;
        }

        @media print {
          body {
            margin: 1cm;
          }

          table {
            font-size: 10px;
          }

          th, td {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      ${tableHTML}
    </body>
    </html>
  `);

  printWindow.document.close();

  // 等待内容加载完成后执行打印
  printWindow.onload = function() {
    setTimeout(() => {
      try {
        printWindow.print();
      } catch (e) {
        console.error('打印出错:', e);
      }
      setTimeout(() => {
        try {
          printWindow.close();
        } catch (e) {
          // ignore
        }
      }, 500);
    }, 500);
  };
}

/**
 * 打印指定元素
 * @param {string|HTMLElement} selector - 选择器或DOM元素
 * @param {string} title - 打印标题
 */
export function printElement(selector, title = '打印内容') {
  let element;
  if (typeof selector === 'string') {
    element = document.querySelector(selector);
  } else {
    element = selector;
  }

  if (!element) {
    console.error('找不到要打印的元素');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('无法打开打印窗口');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <meta charset="UTF-8">
      <style>
        body {
          margin: 20px;
          font-family: Arial, sans-serif;
          font-size: 12px;
        }

        @media print {
          body {
            margin: 1cm;
          }
        }
      </style>
    </head>
    <body>
      <h2 style="text-align: center;">${title}</h2>
      ${element.outerHTML}
    </body>
    </html>
  `);

  printWindow.document.close();

  printWindow.onload = function() {
    setTimeout(() => {
      try {
        printWindow.print();
      } catch (e) {
        console.error('打印出错:', e);
      }
      setTimeout(() => {
        try {
          printWindow.close();
        } catch (e) {
          // ignore
        }
      }, 500);
    }, 500);
  };
}

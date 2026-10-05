<template>
    <div>
      <div class="header">
        <h3>方式一： iframe 嵌入</h3>
        <el-button plain @click="copyCode(code, 'api')" >{{ buttonLabel  }}</el-button>
      </div>
      <pre><code>{{ code }}</code></pre>
      <div class="header">
        <h3>方式二： 链接投放</h3>
        <el-button plain  @click="copyCode(code1, 'component')" >{{ buttonLabel1 }}</el-button>
      </div>
      <pre><code>{{ code1 }}</code></pre>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { ref, toRefs } from 'vue';
  import copy from 'copy-to-clipboard';

  const buttonLabel =ref('复制代码')

  const props = defineProps<{
    surveyPath: {
      type: String;
      required: false;
    };
  }>();
  const { surveyPath } = toRefs(props);
  
  const origin = window.location.origin
  const path = surveyPath.value || 'xxxxxx'

  const code = `<!-- 方式一：iframe 嵌入，把问卷直接放进你自己的页面 -->
<iframe
  src="${origin}/render/${path}"
  style="width: 100%; height: 720px; border: 0;"
  allow="clipboard-write"
></iframe>`

  const buttonLabel1 = ref('复制代码')
  const code1 = `<!-- 方式二：链接投放，可带自定义查询参数做渠道区分 -->
${origin}/render/${path}?ch=wechat
${origin}/render/${path}?ch=poster&from=campus

<!-- 参数会原样保留在答卷上，便于按渠道统计回收量 -->`
  const copyCode = (content: string, type: string) => {

    const data = copy(content)

    if (data) {
      if(type === 'api') {
        buttonLabel.value = '已复制'
      } else {
        buttonLabel1.value = '已复制'
      }
    }
  };

  </script>
  
  <style scoped>
  .header{
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 20px 0 10px 0;

  }
  pre {
    background-color: #f5f5f5;
    padding: 10px;
    border-radius: 5px;
    overflow-x: auto;
  }
  
  code {
    color: #333;
  }
  </style>
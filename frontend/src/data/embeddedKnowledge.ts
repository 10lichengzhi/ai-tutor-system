import { KnowledgePoint, KnowledgeTemplate, ProjectTemplate, PhaseTemplate } from '../types/learning'

// ========== 知识点库（带前置依赖） ==========
const EMBEDDED_KNOWLEDGE_POINTS: KnowledgePoint[] = [
  // === 阶段1：C语言基础 ===
  { id: 'C001', name: '数据类型与变量', desc: '整型、浮点型、字符型、常量定义', difficulty: 1, chapter: 'C语言基础', prerequisites: [], estimatedMinutes: 45, tags: ['C语言', '入门'], status: 'not_started', progress: 0 },
  { id: 'C002', name: '运算符与表达式', desc: '算术、关系、逻辑、位运算符', difficulty: 1, chapter: 'C语言基础', prerequisites: ['C001'], estimatedMinutes: 45, tags: ['C语言'], status: 'not_started', progress: 0 },
  { id: 'C003', name: '流程控制', desc: 'if/else、switch、for、while、break/continue', difficulty: 1, chapter: 'C语言基础', prerequisites: ['C001', 'C002'], estimatedMinutes: 60, tags: ['C语言'], status: 'not_started', progress: 0 },
  { id: 'C004', name: '函数与作用域', desc: '函数定义、参数传递、返回值、递归', difficulty: 2, chapter: 'C语言基础', prerequisites: ['C003'], estimatedMinutes: 60, tags: ['C语言'], status: 'not_started', progress: 0 },
  { id: 'C005', name: '数组与字符串', desc: '一维/二维数组、字符数组、字符串函数', difficulty: 2, chapter: 'C语言基础', prerequisites: ['C004'], estimatedMinutes: 60, tags: ['C语言'], status: 'not_started', progress: 0 },
  { id: 'C006', name: '指针基础', desc: '指针概念、取地址&、解引用*、指针变量', difficulty: 3, chapter: 'C语言基础', prerequisites: ['C005'], estimatedMinutes: 90, tags: ['C语言', '重点'], status: 'not_started', progress: 0 },
  { id: 'C007', name: '指针与数组', desc: '数组指针、指针数组、指针算术', difficulty: 3, chapter: 'C语言基础', prerequisites: ['C006'], estimatedMinutes: 60, tags: ['C语言'], status: 'not_started', progress: 0 },
  { id: 'C008', name: '指针与函数', desc: '函数指针、指针作为函数参数、返回指针', difficulty: 3, chapter: 'C语言基础', prerequisites: ['C007'], estimatedMinutes: 60, tags: ['C语言'], status: 'not_started', progress: 0 },
  { id: 'C009', name: '内存管理', desc: 'malloc、calloc、realloc、free、内存泄漏', difficulty: 4, chapter: 'C语言基础', prerequisites: ['C008'], estimatedMinutes: 90, tags: ['C语言', '重点'], status: 'not_started', progress: 0 },
  { id: 'C010', name: '结构体与联合体', desc: 'struct、union、typedef、位域', difficulty: 2, chapter: 'C语言基础', prerequisites: ['C005'], estimatedMinutes: 60, tags: ['C语言'], status: 'not_started', progress: 0 },
  { id: 'C011', name: '文件IO操作', desc: 'fopen/fclose、fread/fwrite、fprintf/fscanf', difficulty: 2, chapter: 'C语言基础', prerequisites: ['C010'], estimatedMinutes: 60, tags: ['C语言'], status: 'not_started', progress: 0 },
  { id: 'C012', name: '预处理与宏定义', desc: '#define、#include、条件编译、宏函数', difficulty: 2, chapter: 'C语言基础', prerequisites: ['C004'], estimatedMinutes: 45, tags: ['C语言'], status: 'not_started', progress: 0 },

  // === 阶段2：硬件基础 ===
  { id: 'H001', name: '电路基础定律', desc: '欧姆定律、基尔霍夫电流/电压定律', difficulty: 2, chapter: '硬件基础', prerequisites: [], estimatedMinutes: 45, tags: ['硬件', '电路'], status: 'not_started', progress: 0 },
  { id: 'H002', name: '常用元器件', desc: '电阻、电容、电感、二极管、三极管、MOS管', difficulty: 2, chapter: '硬件基础', prerequisites: ['H001'], estimatedMinutes: 60, tags: ['硬件'], status: 'not_started', progress: 0 },
  { id: 'H003', name: '数字电路基础', desc: '高低电平、逻辑门、布尔代数、真值表', difficulty: 2, chapter: '硬件基础', prerequisites: [], estimatedMinutes: 60, tags: ['硬件', '数电'], status: 'not_started', progress: 0 },
  { id: 'H004', name: '时序逻辑电路', desc: '触发器、寄存器、计数器、时钟', difficulty: 3, chapter: '硬件基础', prerequisites: ['H003'], estimatedMinutes: 60, tags: ['硬件', '数电'], status: 'not_started', progress: 0 },
  { id: 'H005', name: '万用表与焊接', desc: '万用表使用、电烙铁焊接、元器件识别', difficulty: 1, chapter: '硬件基础', prerequisites: ['H002'], estimatedMinutes: 90, tags: ['硬件', '实操'], status: 'not_started', progress: 0 },
  { id: 'H006', name: '原理图阅读', desc: '看懂原理图符号、网络标号、电源电路', difficulty: 3, chapter: '硬件基础', prerequisites: ['H002', 'H003'], estimatedMinutes: 60, tags: ['硬件', '实操'], status: 'not_started', progress: 0 },

  // === 阶段3：51单片机 ===
  { id: 'M5101', name: '51单片机架构', desc: '8051内核、存储器结构、特殊功能寄存器', difficulty: 2, chapter: '51单片机', prerequisites: ['C006', 'H003'], estimatedMinutes: 45, tags: ['单片机', '51'], status: 'not_started', progress: 0 },
  { id: 'M5102', name: 'Keil开发环境', desc: '工程创建、编译、下载、仿真调试', difficulty: 1, chapter: '51单片机', prerequisites: ['M5101'], estimatedMinutes: 30, tags: ['单片机', '工具'], status: 'not_started', progress: 0 },
  { id: 'M5103', name: 'GPIO输出与LED', desc: '寄存器配置、点亮LED、延时函数、流水灯', difficulty: 2, chapter: '51单片机', prerequisites: ['M5102'], estimatedMinutes: 60, tags: ['单片机', '实操'], status: 'not_started', progress: 0 },
  { id: 'M5104', name: 'GPIO输入与按键', desc: '按键检测、软件消抖、独立按键/矩阵键盘', difficulty: 2, chapter: '51单片机', prerequisites: ['M5103'], estimatedMinutes: 60, tags: ['单片机', '实操'], status: 'not_started', progress: 0 },
  { id: 'M5105', name: '定时器/计数器', desc: '定时器模式、中断、精准延时', difficulty: 3, chapter: '51单片机', prerequisites: ['M5104'], estimatedMinutes: 90, tags: ['单片机', '重点'], status: 'not_started', progress: 0 },
  { id: 'M5106', name: '外部中断', desc: '中断触发方式、中断服务函数、中断优先级', difficulty: 3, chapter: '51单片机', prerequisites: ['M5105'], estimatedMinutes: 60, tags: ['单片机'], status: 'not_started', progress: 0 },
  { id: 'M5107', name: 'UART串口通信', desc: '串口初始化、波特率、printf重定向、收发数据', difficulty: 3, chapter: '51单片机', prerequisites: ['M5105'], estimatedMinutes: 75, tags: ['单片机', '通信'], status: 'not_started', progress: 0 },
  { id: 'M5108', name: 'I2C总线通信', desc: 'I2C协议时序、EEPROM读写、AT24C02', difficulty: 4, chapter: '51单片机', prerequisites: ['M5107'], estimatedMinutes: 90, tags: ['单片机', '通信'], status: 'not_started', progress: 0 },
  { id: 'M5109', name: 'SPI总线通信', desc: 'SPI协议、OLED屏驱动、显示汉字/图片', difficulty: 4, chapter: '51单片机', prerequisites: ['M5108'], estimatedMinutes: 90, tags: ['单片机', '通信'], status: 'not_started', progress: 0 },
  { id: 'M5110', name: 'ADC/DAC转换', desc: '模数转换、数模转换、PCF8591', difficulty: 3, chapter: '51单片机', prerequisites: ['M5108'], estimatedMinutes: 60, tags: ['单片机'], status: 'not_started', progress: 0 },

  // === 阶段4：STM32开发 ===
  { id: 'STM3201', name: 'STM32与ARM Cortex-M', desc: 'STM32产品线、Cortex-M内核架构、存储器映射', difficulty: 3, chapter: 'STM32', prerequisites: ['M5106'], estimatedMinutes: 60, tags: ['STM32', 'ARM'], status: 'not_started', progress: 0 },
  { id: 'STM3202', name: 'CubeMX与HAL库', desc: 'CubeMX图形化配置、HAL库结构、工程生成', difficulty: 2, chapter: 'STM32', prerequisites: ['STM3201'], estimatedMinutes: 60, tags: ['STM32', '工具'], status: 'not_started', progress: 0 },
  { id: 'STM3203', name: 'GPIO与外部中断', desc: 'CubeMX配置GPIO、按键中断、回调函数', difficulty: 2, chapter: 'STM32', prerequisites: ['STM3202'], estimatedMinutes: 60, tags: ['STM32', '实操'], status: 'not_started', progress: 0 },
  { id: 'STM3204', name: '定时器与PWM', desc: '基本定时器、通用定时器、PWM输出、输入捕获', difficulty: 3, chapter: 'STM32', prerequisites: ['STM3203'], estimatedMinutes: 90, tags: ['STM32', '重点'], status: 'not_started', progress: 0 },
  { id: 'STM3205', name: '串口与DMA', desc: 'USART收发、printf重定向、DMA高效传输', difficulty: 3, chapter: 'STM32', prerequisites: ['STM3204'], estimatedMinutes: 75, tags: ['STM32', '通信'], status: 'not_started', progress: 0 },
  { id: 'STM3206', name: 'ADC多通道采集', desc: '单通道/多通道ADC、DMA传输、内部温度传感器', difficulty: 3, chapter: 'STM32', prerequisites: ['STM3205'], estimatedMinutes: 60, tags: ['STM32'], status: 'not_started', progress: 0 },
  { id: 'STM3207', name: 'I2C/SPI驱动外设', desc: '硬件I2C/SPI、OLED/OLED屏、传感器读取', difficulty: 3, chapter: 'STM32', prerequisites: ['STM3205'], estimatedMinutes: 75, tags: ['STM32', '通信'], status: 'not_started', progress: 0 },
  { id: 'STM3208', name: '看门狗与低功耗', desc: '独立看门狗、窗口看门狗、低功耗模式', difficulty: 3, chapter: 'STM32', prerequisites: ['STM3204'], estimatedMinutes: 60, tags: ['STM32'], status: 'not_started', progress: 0 },

  // === 阶段5：FreeRTOS ===
  { id: 'RTOS01', name: 'RTOS基础概念', desc: '前后台系统 vs RTOS、多任务、调度器', difficulty: 3, chapter: 'FreeRTOS', prerequisites: ['STM3204'], estimatedMinutes: 45, tags: ['RTOS', '操作系统'], status: 'not_started', progress: 0 },
  { id: 'RTOS02', name: '任务管理', desc: '任务创建、删除、挂起、恢复、任务状态', difficulty: 3, chapter: 'FreeRTOS', prerequisites: ['RTOS01'], estimatedMinutes: 60, tags: ['RTOS'], status: 'not_started', progress: 0 },
  { id: 'RTOS03', name: '队列与消息传递', desc: '队列创建、发送/接收、队列集', difficulty: 4, chapter: 'FreeRTOS', prerequisites: ['RTOS02'], estimatedMinutes: 75, tags: ['RTOS', '重点'], status: 'not_started', progress: 0 },
  { id: 'RTOS04', name: '信号量与互斥锁', desc: '二值信号量、计数信号量、互斥锁、优先级反转', difficulty: 4, chapter: 'FreeRTOS', prerequisites: ['RTOS03'], estimatedMinutes: 75, tags: ['RTOS', '重点'], status: 'not_started', progress: 0 },
  { id: 'RTOS05', name: '软件定时器', desc: '定时器创建、回调函数、单次/周期定时器', difficulty: 3, chapter: 'FreeRTOS', prerequisites: ['RTOS04'], estimatedMinutes: 45, tags: ['RTOS'], status: 'not_started', progress: 0 },
  { id: 'RTOS06', name: '事件标志组', desc: '事件位、事件组、任务同步', difficulty: 3, chapter: 'FreeRTOS', prerequisites: ['RTOS04'], estimatedMinutes: 45, tags: ['RTOS'], status: 'not_started', progress: 0 },
  { id: 'RTOS07', name: '任务通知', desc: '轻量级任务通知、替代信号量/队列', difficulty: 4, chapter: 'FreeRTOS', prerequisites: ['RTOS06'], estimatedMinutes: 60, tags: ['RTOS'], status: 'not_started', progress: 0 },

  // === 阶段6：嵌入式Linux ===
  { id: 'LINUX01', name: 'Linux基础命令', desc: '文件操作、进程管理、权限、管道、grep/find', difficulty: 2, chapter: '嵌入式Linux', prerequisites: [], estimatedMinutes: 90, tags: ['Linux', '基础'], status: 'not_started', progress: 0 },
  { id: 'LINUX02', name: 'Shell脚本编程', desc: '变量、条件判断、循环、函数、脚本调试', difficulty: 3, chapter: '嵌入式Linux', prerequisites: ['LINUX01'], estimatedMinutes: 60, tags: ['Linux', 'Shell'], status: 'not_started', progress: 0 },
  { id: 'LINUX03', name: 'Vim与GCC', desc: 'Vim操作、GCC编译、GDB调试', difficulty: 2, chapter: '嵌入式Linux', prerequisites: ['LINUX01'], estimatedMinutes: 45, tags: ['Linux', '工具'], status: 'not_started', progress: 0 },
  { id: 'LINUX04', name: 'Makefile编写', desc: 'Makefile规则、变量、自动推导、伪目标', difficulty: 3, chapter: '嵌入式Linux', prerequisites: ['LINUX03'], estimatedMinutes: 60, tags: ['Linux', '构建'], status: 'not_started', progress: 0 },
  { id: 'LINUX05', name: '交叉编译环境', desc: '交叉编译器、sysroot、工具链', difficulty: 3, chapter: '嵌入式Linux', prerequisites: ['LINUX04'], estimatedMinutes: 45, tags: ['Linux', '交叉编译'], status: 'not_started', progress: 0 },
  { id: 'LINUX06', name: '内核模块编程', desc: '模块加载/卸载、module_init/exit、 printk', difficulty: 4, chapter: '嵌入式Linux', prerequisites: ['LINUX05'], estimatedMinutes: 90, tags: ['Linux', '驱动'], status: 'not_started', progress: 0 },
  { id: 'LINUX07', name: '字符设备驱动', desc: 'file_operations、register_chrdev、用户态交互', difficulty: 5, chapter: '嵌入式Linux', prerequisites: ['LINUX06'], estimatedMinutes: 120, tags: ['Linux', '驱动', '重点'], status: 'not_started', progress: 0 },
  { id: 'LINUX08', name: '平台总线与设备树', desc: 'platform_driver、设备树语法、pinctrl', difficulty: 5, chapter: '嵌入式Linux', prerequisites: ['LINUX07'], estimatedMinutes: 90, tags: ['Linux', '驱动', '重点'], status: 'not_started', progress: 0 },
  { id: 'LINUX09', name: 'Linux子系统驱动', desc: 'GPIO子系统、I2C子系统、INPUT子系统', difficulty: 5, chapter: '嵌入式Linux', prerequisites: ['LINUX08'], estimatedMinutes: 120, tags: ['Linux', '驱动'], status: 'not_started', progress: 0 },

  // === 阶段7：机器人工程 ===
  { id: 'ROBOT01', name: '电机驱动基础', desc: '直流电机、L298N/L293D、H桥电路', difficulty: 3, chapter: '机器人', prerequisites: ['STM3204'], estimatedMinutes: 60, tags: ['机器人', '电机'], status: 'not_started', progress: 0 },
  { id: 'ROBOT02', name: 'PWM调速与编码器', desc: 'PWM调速原理、编码器测速、M/T法', difficulty: 3, chapter: '机器人', prerequisites: ['ROBOT01'], estimatedMinutes: 60, tags: ['机器人', '电机'], status: 'not_started', progress: 0 },
  { id: 'ROBOT03', name: 'PID控制算法', desc: '位置式PID、增量式PID、参数整定', difficulty: 4, chapter: '机器人', prerequisites: ['ROBOT02'], estimatedMinutes: 90, tags: ['机器人', '控制算法', '重点'], status: 'not_started', progress: 0 },
  { id: 'ROBOT04', name: '常用传感器', desc: '超声波测距、红外避障、MPU6050六轴', difficulty: 3, chapter: '机器人', prerequisites: ['STM3207'], estimatedMinutes: 90, tags: ['机器人', '传感器'], status: 'not_started', progress: 0 },
  { id: 'ROBOT05', name: 'ROS基础概念', desc: 'ROS架构、节点、话题、服务、参数服务器', difficulty: 3, chapter: '机器人', prerequisites: ['LINUX01'], estimatedMinutes: 120, tags: ['ROS', '机器人'], status: 'not_started', progress: 0 },
  { id: 'ROBOT06', name: 'ROS通信编程', desc: '话题发布订阅、服务客户端、自定义消息', difficulty: 4, chapter: '机器人', prerequisites: ['ROBOT05'], estimatedMinutes: 120, tags: ['ROS', '编程'], status: 'not_started', progress: 0 },
  { id: 'ROBOT07', name: 'TF坐标变换', desc: '坐标系、TF广播/监听、URDF模型', difficulty: 4, chapter: '机器人', prerequisites: ['ROBOT06'], estimatedMinutes: 90, tags: ['ROS'], status: 'not_started', progress: 0 },
  { id: 'ROBOT08', name: 'SLAM建图', desc: 'Gmapping、Cartographer、激光雷达', difficulty: 5, chapter: '机器人', prerequisites: ['ROBOT07'], estimatedMinutes: 180, tags: ['ROS', 'SLAM', '重点'], status: 'not_started', progress: 0 },
  { id: 'ROBOT09', name: '自主导航', desc: 'Navigation Stack、全局/局部路径规划、避障', difficulty: 5, chapter: '机器人', prerequisites: ['ROBOT08'], estimatedMinutes: 180, tags: ['ROS', '导航'], status: 'not_started', progress: 0 },

  // === 阶段8：求职准备 ===
  { id: 'JOB01', name: 'C语言笔试', desc: '指针、内存、字符串、数据结构常考题', difficulty: 3, chapter: '求职准备', prerequisites: ['C009'], estimatedMinutes: 180, tags: ['求职', '笔试'], status: 'not_started', progress: 0 },
  { id: 'JOB02', name: '数据结构与算法', desc: '链表、栈队列、二叉树、排序查找', difficulty: 4, chapter: '求职准备', prerequisites: ['C009'], estimatedMinutes: 180, tags: ['求职', '算法'], status: 'not_started', progress: 0 },
  { id: 'JOB03', name: '操作系统基础', desc: '进程线程、内存管理、进程间通信', difficulty: 3, chapter: '求职准备', prerequisites: ['RTOS01'], estimatedMinutes: 120, tags: ['求职', 'OS'], status: 'not_started', progress: 0 },
  { id: 'JOB04', name: '项目复盘与简历', desc: 'STAR法则、项目亮点、简历优化', difficulty: 2, chapter: '求职准备', prerequisites: [], estimatedMinutes: 120, tags: ['求职', '简历'], status: 'not_started', progress: 0 },
  { id: 'JOB05', name: '技术面试', desc: '项目讲解、八股文、手撕代码、模拟面试', difficulty: 4, chapter: '求职准备', prerequisites: ['JOB04'], estimatedMinutes: 120, tags: ['求职', '面试'], status: 'not_started', progress: 0 },
]

// ========== 项目库 ==========
const PROJECT_LIBRARY: ProjectTemplate[] = [
  // C语言项目
  {
    id: 'PROJ_C01', title: '学生管理系统', desc: '基于链表的学生信息增删改查，支持文件存储',
    difficulty: 2, requiredKnowledgePointIds: ['C009', 'C010', 'C011'], estimatedDays: 2, tags: ['C语言', '入门'],
    deliverables: [{ type: 'code', title: '完整源码', desc: '可编译运行的C代码', required: true }]
  },
  {
    id: 'PROJ_C02', title: '通用链表实现', desc: '实现可存储任意类型数据的通用链表库',
    difficulty: 3, requiredKnowledgePointIds: ['C009', 'C008'], estimatedDays: 1, tags: ['C语言', '数据结构'],
    deliverables: [{ type: 'code', title: 'list.h + list.c', desc: '可复用的链表库', required: true }]
  },

  // 硬件基础项目
  {
    id: 'PROJ_H01', title: 'STM32最小系统板焊接', desc: '焊接一块STM32F103最小系统板并测试',
    difficulty: 2, requiredKnowledgePointIds: ['H005'], estimatedDays: 1, tags: ['硬件', '焊接'],
    deliverables: [{ type: 'hardware', title: '焊好的最小系统板', desc: '能正常下载程序、点亮LED', required: true }]
  },

  // 51单片机项目
  {
    id: 'PROJ_5101', title: 'LED流水灯', desc: '8个LED实现各种花式流水灯效果',
    difficulty: 1, requiredKnowledgePointIds: ['M5103'], estimatedDays: 1, tags: ['51', '入门'],
    deliverables: [{ type: 'code', title: '流水灯代码', desc: '至少3种流水效果', required: true }]
  },
  {
    id: 'PROJ_5102', title: '电子时钟', desc: '数码管显示时分秒，按键调时，定时器走时',
    difficulty: 3, requiredKnowledgePointIds: ['M5105', 'M5104'], estimatedDays: 2, tags: ['51', '综合'],
    deliverables: [{ type: 'code', title: '电子时钟代码', desc: '精准走时、按键可调', required: true }, { type: 'video', title: '演示视频', desc: '拍一段运行视频', required: false }]
  },
  {
    id: 'PROJ_5103', title: '温湿度监测', desc: 'DHT11采集温湿度，OLED显示',
    difficulty: 3, requiredKnowledgePointIds: ['M5109'], estimatedDays: 2, tags: ['51', '传感器'],
    deliverables: [{ type: 'code', title: '监测代码', desc: '实时显示温湿度', required: true }]
  },

  // STM32项目
  {
    id: 'PROJ_STM01', title: '按键控制LED', desc: '按键短按/长按切换LED模式',
    difficulty: 1, requiredKnowledgePointIds: ['STM3203'], estimatedDays: 1, tags: ['STM32', '入门'],
    deliverables: [{ type: 'code', title: '工程代码', desc: 'CubeMX工程', required: true }]
  },
  {
    id: 'PROJ_STM02', title: '环境监测站', desc: '温湿度+光照+ADC采集，OLED显示，串口上报',
    difficulty: 3, requiredKnowledgePointIds: ['STM3206', 'STM3207'], estimatedDays: 3, tags: ['STM32', '综合'],
    deliverables: [{ type: 'code', title: '完整工程', desc: '可运行的监测系统', required: true }, { type: 'video', title: '演示视频', desc: '功能演示', required: false }]
  },
  {
    id: 'PROJ_STM03', title: '智能小车底盘', desc: '电机驱动、PID调速、串口控制运动',
    difficulty: 4, requiredKnowledgePointIds: ['STM3204', 'ROBOT03'], estimatedDays: 3, tags: ['STM32', '机器人'],
    deliverables: [{ type: 'code', title: '小车控制代码', desc: '可遥控前后左右转向', required: true }, { type: 'hardware', title: '小车硬件', desc: '组装好的小车底盘', required: true }]
  },

  // FreeRTOS项目
  {
    id: 'PROJ_RTOS01', title: 'FreeRTOS多任务重构', desc: '用RTOS重写之前的环境监测站',
    difficulty: 3, requiredKnowledgePointIds: ['RTOS04'], estimatedDays: 2, tags: ['RTOS', '重构'],
    deliverables: [{ type: 'code', title: 'RTOS版本代码', desc: '多任务架构', required: true }]
  },

  // Linux驱动项目
  {
    id: 'PROJ_LINUX01', title: 'LED字符设备驱动', desc: '从零写LED驱动，应用层控制亮灭',
    difficulty: 4, requiredKnowledgePointIds: ['LINUX07'], estimatedDays: 2, tags: ['Linux', '驱动'],
    deliverables: [{ type: 'code', title: '驱动模块+应用程序', desc: 'insmod后可控制LED', required: true }]
  },

  // 机器人综合项目
  {
    id: 'PROJ_ROBOT01', title: '避障小车', desc: '超声波/红外避障，自动行驶',
    difficulty: 4, requiredKnowledgePointIds: ['ROBOT04', 'PROJ_STM03'], estimatedDays: 3, tags: ['机器人', '避障'],
    deliverables: [{ type: 'code', title: '避障代码', desc: '可自动避障行驶', required: true }, { type: 'video', title: '演示视频', desc: '避障效果演示', required: true }]
  },
  {
    id: 'PROJ_ROBOT02', title: 'ROS自主导航机器人', desc: '激光雷达SLAM建图+自主导航避障',
    difficulty: 5, requiredKnowledgePointIds: ['ROBOT09'], estimatedDays: 5, tags: ['ROS', '导航', '旗舰'],
    deliverables: [{ type: 'code', title: 'ROS功能包', desc: '完整导航功能', required: true }, { type: 'video', title: '演示视频', desc: '建图+导航演示', required: true }, { type: 'blog', title: '博客/文档', desc: '记录踩坑过程', required: false }]
  },

  // 求职项目
  {
    id: 'PROJ_JOB01', title: 'GitHub作品集整理', desc: '所有项目代码整理、写README、加注释',
    difficulty: 2, requiredKnowledgePointIds: [], estimatedDays: 3, tags: ['求职', 'GitHub'],
    deliverables: [{ type: 'code', title: 'GitHub仓库', desc: '整洁的作品集', required: true }]
  },
]

// ========== 阶段模板 ==========
const PHASE_TEMPLATES: PhaseTemplate[] = [
  {
    id: 1, title: 'C语言程序设计基础', description: '夯实C语言基础，指针和内存管理是重中之重',
    minWeeks: 1, maxWeeks: 3, defaultWeeks: 2, required: true,
    knowledgePointIds: ['C001','C002','C003','C004','C005','C006','C007','C008','C009','C010','C011','C012'],
    weeklyProjects: [PROJECT_LIBRARY.find(p => p.id === 'PROJ_C01')!, PROJECT_LIBRARY.find(p => p.id === 'PROJ_C02')!]
  },
  {
    id: 2, title: '电路与硬件基础', description: '能看懂原理图，会用万用表，会焊接',
    minWeeks: 1, maxWeeks: 2, defaultWeeks: 2, required: true,
    knowledgePointIds: ['H001','H002','H003','H004','H005','H006'],
    weeklyProjects: [PROJECT_LIBRARY.find(p => p.id === 'PROJ_H01')!]
  },
  {
    id: 3, title: '51单片机快速入门', description: '理解寄存器操作，建立MCU开发思维',
    minWeeks: 2, maxWeeks: 4, defaultWeeks: 2, required: true,
    knowledgePointIds: ['M5101','M5102','M5103','M5104','M5105','M5106','M5107','M5108','M5109','M5110'],
    weeklyProjects: [PROJECT_LIBRARY.find(p => p.id === 'PROJ_5101')!, PROJECT_LIBRARY.find(p => p.id === 'PROJ_5102')!, PROJECT_LIBRARY.find(p => p.id === 'PROJ_5103')!]
  },
  {
    id: 4, title: 'STM32开发（HAL库）', description: '主流ARM Cortex-M开发，必须熟练掌握',
    minWeeks: 3, maxWeeks: 6, defaultWeeks: 4, required: true,
    knowledgePointIds: ['STM3201','STM3202','STM3203','STM3204','STM3205','STM3206','STM3207','STM3208'],
    weeklyProjects: [PROJECT_LIBRARY.find(p => p.id === 'PROJ_STM01')!, PROJECT_LIBRARY.find(p => p.id === 'PROJ_STM02')!]
  },
  {
    id: 5, title: 'FreeRTOS实时操作系统', description: '多任务开发，应对复杂项目',
    minWeeks: 2, maxWeeks: 3, defaultWeeks: 2, required: true,
    knowledgePointIds: ['RTOS01','RTOS02','RTOS03','RTOS04','RTOS05','RTOS06','RTOS07'],
    weeklyProjects: [PROJECT_LIBRARY.find(p => p.id === 'PROJ_RTOS01')!]
  },
  {
    id: 6, title: '嵌入式Linux开发', description: '从命令行到驱动开发，Linux方向核心',
    minWeeks: 3, maxWeeks: 6, defaultWeeks: 5, required: false,
    knowledgePointIds: ['LINUX01','LINUX02','LINUX03','LINUX04','LINUX05','LINUX06','LINUX07','LINUX08','LINUX09'],
    weeklyProjects: [PROJECT_LIBRARY.find(p => p.id === 'PROJ_LINUX01')!]
  },
  {
    id: 7, title: '机器人工程专项', description: '电机控制、传感器、ROS、SLAM导航',
    minWeeks: 4, maxWeeks: 8, defaultWeeks: 6, required: false,
    knowledgePointIds: ['ROBOT01','ROBOT02','ROBOT03','ROBOT04','ROBOT05','ROBOT06','ROBOT07','ROBOT08','ROBOT09'],
    weeklyProjects: [PROJECT_LIBRARY.find(p => p.id === 'PROJ_STM03')!, PROJECT_LIBRARY.find(p => p.id === 'PROJ_ROBOT01')!, PROJECT_LIBRARY.find(p => p.id === 'PROJ_ROBOT02')!]
  },
  {
    id: 8, title: '项目整理与求职准备', description: '项目打磨、简历优化、笔试面试',
    minWeeks: 2, maxWeeks: 6, defaultWeeks: 4, required: true,
    knowledgePointIds: ['JOB01','JOB02','JOB03','JOB04','JOB05'],
    weeklyProjects: [PROJECT_LIBRARY.find(p => p.id === 'PROJ_JOB01')!]
  },
]

// ========== 嵌入式方向完整知识库模板 ==========
export const EMBEDDED_ROBOT_TEMPLATE: KnowledgeTemplate = {
  direction: 'embedded_robot',
  name: '嵌入式Linux + 机器人工程方向',
  description: '从C语言零基础到就业，涵盖单片机、RTOS、Linux驱动、ROS机器人',
  defaultTotalWeeks: 28,
  phases: PHASE_TEMPLATES,
  knowledgeBase: EMBEDDED_KNOWLEDGE_POINTS,
  projectLibrary: PROJECT_LIBRARY,
}

// ========== 方向注册表（后续加新方向在这里注册） ==========
export const DIRECTION_TEMPLATES: Record<string, KnowledgeTemplate> = {
  embedded_robot: EMBEDDED_ROBOT_TEMPLATE,
}

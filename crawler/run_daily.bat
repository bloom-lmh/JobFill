@echo off
rem 一键拉取官网公告岗位：运行爬虫，生成 crawler\output\jobs.json
rem 手动双击或 Windows 任务计划均可用；输出写日志，避免任务计划因无控制台卡在 pause
chcp 65001 >nul
cd /d "%~dp0.."
python crawler\crawl.py > crawler\output\last_run.log 2>&1
echo 完成，日志见 crawler\output\last_run.log

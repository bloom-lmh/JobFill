@echo off
rem 一键拉取官网公告岗位：运行爬虫，生成 crawler\output\jobs.json
chcp 65001 >nul
cd /d "%~dp0.."
python crawler\crawl.py
echo.
echo 完成。请回到岗位清单页，点「导入 JSON」选择 crawler\output\jobs.json。
pause

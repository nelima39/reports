import express from 'express'
import path from 'path'
export default express.static(path.join(__dirname, '../static/public'))

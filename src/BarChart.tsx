import crypto from "crypto"
import React, { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import Papa from "papaparse"
import {
  VictoryBar,
  VictoryChart,
  VictoryContainer,
  VictoryGroup,
  VictoryLegend,
  VictoryTheme,
  VictoryTooltip
} from "victory"

const random6HexChars = (name: string) => {
  let hash = crypto
    .createHash("md5")
    .update(name)
    .digest("hex")
  return hash.slice(0, 6)
}

let maxValue = 0

interface datumType {
  x: number
  y: number
  label: string
}
interface revenueData {
  name: string
  columnData: datumType[]
  hidden: boolean
}
type dataArrayType = revenueData[]

const BarChart: React.FC = () => {
  const initialValue: dataArrayType = []
  const [dataArray, setDataArray] = useState(initialValue)

  const onDrop = useCallback(
    acceptedFiles => {
      const aggregate = (results: Papa.ParseResult) => {
        const columnData: datumType[] = [{ x: 0, y: 0, label: "" }]

        const revenueRows = results.data
          .filter(row => {
            return row.length >= 15
          })
          .filter(row => {
            const firstColumn: string = row[0]
            return parseInt(firstColumn).toString() === firstColumn
          })

        const dateIndex = 1
        revenueRows.forEach(row => {
          const dateObject = new Date(row[dateIndex])
          const date = dateObject.getDate()
          if (!columnData[date]) {
            columnData[date] = {
              x: date,
              y: 0,
              label: ""
            }
          }

          const newY = columnData[date].y + 1
          if (newY > maxValue) maxValue = newY
          columnData[date].y = newY
          columnData[date].label = `${newY}`
        })

        return columnData
      }

      let tmp: any = []
      let lastItemIndex = acceptedFiles.length - 1
      acceptedFiles.forEach((file: File, index: number) => {
        const hitData = dataArray.find(data => data.name === file.name)
        if (hitData) return

        let reader: FileReader = new FileReader()
        reader.onabort = () => console.log("file reading was aborted")
        reader.onerror = () => console.log("file reading has failed")
        reader.onload = () => {
          if (typeof reader.result == "string") {
            const results = Papa.parse(reader.result as string)
            const columnData = aggregate(results)
            const data = { name: file.name, columnData, hidden: false }
            tmp = [...tmp, data]
            if (index === lastItemIndex) {
              setDataArray([...dataArray, ...tmp])
            }
          }
        }
        reader.readAsText(file)
      })
    },
    [dataArray]
  )

  const { getRootProps, getInputProps } = useDropzone({ onDrop })

  const legendNames = dataArray.map(data => {
    return { name: data.name }
  })

  let offset = 10.0 / (legendNames.length + 1)

  const legendStyle = {
    labels: { fontSize: 6, fontFamily: "Palatino" }
  }

  return (
    <div>
      <h2>Yet Another Revenue Visualizer for Udemy Teachers</h2>
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <p>Drag 'n' drop some csv files here, or click to select them.</p>
      </div>

      <VictoryChart
        theme={VictoryTheme.material}
        domain={{ x: [0, 31], y: [0, maxValue + 10] }}
        style={{ parent: { maxWidth: "100%" } }}
        height={200}
      >
        <VictoryLegend
          style={legendStyle}
          padding={{ top: 20, bottom: 60 }}
          containerComponent={<VictoryContainer responsive={true} />}
          borderPadding={{ bottom: 10 }}
          centerTitle
          standalone={true}
          x={250}
          y={0}
          orientation="vertical"
          gutter={5}
          rowGutter={{ top: 0, bottom: 0 }}
          data={legendNames}
          colorScale={legendNames.map(
            legendName => `#${random6HexChars(legendName.name)}`
          )}
          events={[
            {
              target: "data",
              eventHandlers: {
                onClick: () => {
                  return [
                    {
                      target: "data",
                      mutation: props => {
                        const toggledDataArray = dataArray.map(data => {
                          if (props.datum.name === data.name) {
                            console.log("===")
                            return { ...data, hidden: !data.hidden }
                          } else {
                            return data
                          }
                        })
                        setDataArray(toggledDataArray)
                        return null
                      }
                    }
                  ]
                }
              }
            }
          ]}
        />

        <VictoryGroup
          offset={offset}
          style={{ data: { width: 5.0 / (legendNames.length + 1) } }}
          colorScale={"qualitative"}
        >
          {dataArray
            .filter(data => data.hidden === false)
            .map(data => {
              console.log({ hidden: data.hidden })
              return (
                <VictoryBar
                  style={{ data: { fill: `#${random6HexChars(data.name)}` } }}
                  labelComponent={<VictoryTooltip />}
                  key={data.name}
                  data={data.columnData}
                />
              )
            })}
        </VictoryGroup>
      </VictoryChart>
    </div>
  )
}

export default BarChart

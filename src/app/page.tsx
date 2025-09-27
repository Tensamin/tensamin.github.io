"use client";

import React, { useEffect, useState, useId, useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

type Check = {
  t: string;
  ok: boolean;
  code: number;
  rt: number;
};

type Data = {
  id: string;
  name: string;
  url: string;
  checks: Check[];
};

type UptimeChartProps = {
  checks: Check[];
  className?: string;
  // Width of the color fade at ok-state boundaries (in % of chart width)
  fadePct?: number; // default 1.5
};

const chartConfig = {
  responseTime: {
    label: "Response Time (ms)",
    color: "var(--chart-1)",
  },
  online: {
    label: "Online",
    color: "var(--chart-2)",
  },
  offline: {
    label: "Offline",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const baseUrl =
  "https://raw.githubusercontent.com/Tensamin/tensamin.github.io/refs/heads/main/data";

export default function Home() {
  const [appData, setAppData] = useState<Data | null>(null);
  const [authData, setAuthData] = useState<Data | null>(null);
  const [docsData, setDocsData] = useState<Data | null>(null);

  useEffect(() => {
    fetch(baseUrl + "/app.json")
      .then((response) => response.json())
      .then(setAppData);

    fetch(baseUrl + "/auth.json")
      .then((response) => response.json())
      .then(setAuthData);

    fetch(baseUrl + "/docs.json")
      .then((response) => response.json())
      .then(setDocsData);

    // Reload every 10 minutes
    setTimeout(() => {
      window.location.reload();
    }, 600000);
  }, []);

  return (
    <div className="flex flex-col gap-15 p-15 h-full">
      <p className="text-4xl font-bold">Tensamin Satus</p>
      <div className="flex gap-5 h-auto">
        {appData && (
          <Chart checks={appData.checks} url={appData.url} title="App" />
        )}
        {authData && (
          <Chart
            checks={authData.checks}
            url={authData.url}
            title="Auth Server"
          />
        )}
        {docsData && (
          <Chart
            checks={docsData.checks}
            url={docsData.url}
            title="Documentation"
          />
        )}
      </div>
    </div>
  );
}

function Chart({
  checks,
  url,
  title,
}: {
  checks: Check[];
  url: string;
  title: string;
}) {
  return (
    <Card className="w-1/3">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={checks}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="t"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              dataKey="rt"
              type="natural"
              fill="var(--chart-2)"
              fillOpacity={0.4}
              stroke="var(--chart-2)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <a href={url} className="underline text-xs font-light">
          {url}
        </a>
      </CardFooter>
    </Card>
  );
}

self.onmessage = (e) => {
  const { buildings, selection } = e.data;

  const filtered =  buildings.filter((building: any) => {
    //Missing required stuff
    if (!building.yearofconstruction || building.yearofconstruction === 0) return false;

    const inRange = selection.min <= building.yearofconstruction && building.yearofconstruction <= selection.max;
    const inUsage = selection.usage === "Kaikki" || building.usage === selection.usage;

    return inRange && inUsage;
  })

  self.postMessage(filtered)
}
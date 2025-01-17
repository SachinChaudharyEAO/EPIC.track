import React from 'react';
import {
  Alert, Autocomplete, Box, Button, Container, FormLabel, Grid, IconButton, TextField, Tooltip
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import MaterialReactTable, {
  MRT_ColumnDef,
  MRT_ColumnFiltersState,
  MRT_FullScreenToggleButton,
  MRT_ShowHideColumnsButton,
  MRT_TableInstance,
  MRT_ToggleFiltersButton,
  MRT_VisibilityState
} from 'material-react-table';
import { json2csv } from 'json-2-csv';
import { RESULT_STATUS, REPORT_TYPE, DATE_FORMAT } from '../../../constants/application-constant';
import ReportService from '../../../services/reportService';
import { dateUtils } from '../../../utils';
import { ResourceForecastModel } from './type';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import FileDownloadIcon from '@mui/icons-material/FileDownload';


export default function ResourceForecast() {
  const [reportDate, setReportDate] = React.useState<string>();
  const [resultStatus, setResultStatus] = React.useState<string>();
  const [rfData, setRFData] = React.useState<ResourceForecastModel[]>([]);
  const [columnFilters, setColumnFilters] = React.useState<MRT_ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<MRT_VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState();
  const [filters, setFilters] = React.useState({});

  const FILENAME_PREFIX = 'EAO_Resource_Forecast';

  console.log('COLUMN FILTERS', columnFilters);
  console.log('COLUMN VISIBILITY', columnVisibility, filters);
  // console.log('GLOBAL FILTER', globalFilter);
  console.log('FILTERS ', filters);
  const exportToCsv = React.useCallback(async(table: MRT_TableInstance<ResourceForecastModel>)=>{
    const filteredResult = table.getFilteredRowModel().flatRows.map(p=>{
      return {
        ...p.original,
        [p.original.months[0].label]: p.original.months[0].phase,
        [p.original.months[1].label]: p.original.months[1].phase,
        [p.original.months[2].label]: p.original.months[2].phase,
        [p.original.months[3].label]: p.original.months[3].phase,
      }
    });
    const columns = table.getVisibleFlatColumns().map(p=>p.columnDef.id?.toString());
    const csv = await json2csv(filteredResult,{
      emptyFieldValue: '',
      keys: columns as string[]
    });
    const url = window.URL.createObjectURL(new Blob([(csv as any)]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download',
      `${FILENAME_PREFIX}-${dateUtils.formatDate(reportDate ? reportDate :
        new Date().toISOString())}.csv`);
    document.body.appendChild(link);
    link.click();
  },[]);
  React.useEffect(() => {
    setFilters((prev) => {
      const state = {
        ...prev,
        exclude: Object.keys(columnVisibility).filter(p => !!p),
        filter_search: columnFilters.map(p => { return { [p.id]: p.value } }),
        global_search: globalFilter
      };
      return state;
    });
  }, [columnFilters, columnVisibility, globalFilter]);
  
  const setMonthColumns = React.useCallback(() => {
    let columns: Array<MRT_ColumnDef<ResourceForecastModel>> = [];
    if (rfData && rfData.length > 0) {
      columns = rfData[0].months.map((rfMonth: any, index: number) => {
        return {
          header: rfMonth['label'],
          accessorFn: (row: any) => `${row.months[index].phase}`,
          enableHiding: false,
          enableColumnFilter: false,
          Cell: ({ row }: any) => (
            <Box sx={{
              bgcolor: row.original.months[index].color,
              display: 'flex',
              flexWrap: 'wrap',
              alignContent: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }
            }>
              {row.original.months[index].phase}
            </Box>
          )
        } as MRT_ColumnDef<ResourceForecastModel>
      })
    }
    return columns;
  }, [rfData]);

  const filterFn = React.useCallback((filterField: keyof ResourceForecastModel) => rfData
    .filter(p => p[filterField])
    .map(p => p[filterField]?.toString())
    .filter((ele, index, arr) => arr.findIndex(t => t === ele) === index), [rfData])

  const projectFilter = filterFn('project_name');
  const eaTypeFilter = filterFn('ea_type');
  const projectPhaseFilter = filterFn('project_phase');
  const eaActFilter = filterFn('ea_act');
  const iaacFilter = filterFn('iaac');
  const typeFilter = filterFn('sector(sub)');
  // const typeFilter = React.useMemo(() => rfData.map(p => `${p.type}( ${p.sub_type} )`)
  //   .filter((ele, index, arr) => arr.findIndex(t => t === ele) === index), [rfData]);
  const envRegionFilter = filterFn('env_region');
  const nrsRegionFilter = filterFn('nrs_region');
  const workLeadFilter = filterFn('work_lead');
  const epdFilter = filterFn('responsible_epd');
  const teamFilter = filterFn('eao_team');
  const cairtLeadFilter = filterFn('cairt_lead');

  const columns = React.useMemo<MRT_ColumnDef<ResourceForecastModel>[]>(
    () => [
      {
        accessorKey: 'project_name',
        header: 'Project',
        enableHiding: false,
        filterVariant: 'multi-select',
        filterSelectOptions: projectFilter,
        Filter: ({ ...props }) => <Autocomplete
          multiple
          options={projectFilter}
          onChange={(e, value) => props.header.column.setFilterValue(value)}
          value={props.header.column.getFilterValue() ?
            props.header.column.getFilterValue() as [] : []}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="standard"
              placeholder="Select to Hide"
            />
          )}
        />,
        filterFn: (row, id, filterValue) => {
          return !filterValue.includes(row.getValue(id))
        }
      },
      {
        accessorKey: 'capital_investment',
        header: 'Capital Investment'
      },
      {
        accessorKey: 'ea_type',
        header: 'EA Type',
        filterVariant: 'select',
        filterSelectOptions: eaTypeFilter
      },
      {
        accessorKey: 'project_phase',
        header: 'Project Phase',
        filterVariant: 'select',
        filterSelectOptions: projectPhaseFilter
      },
      {
        accessorKey: 'ea_act',
        header: 'EA Act',
        filterVariant: 'select',
        filterSelectOptions: eaActFilter
      },
      {
        accessorKey: 'iaac',
        header: 'IAAC',
        filterVariant: 'select',
        filterSelectOptions: iaacFilter
      },
      {
        accessorKey: 'sector(sub)',
        header: 'Type (Subtype)',
        filterVariant: 'select',
        filterSelectOptions: typeFilter
      },
      {
        accessorKey: 'env_region',
        header: 'ENV Region',
        filterVariant: 'select',
        filterSelectOptions: envRegionFilter
      },
      {
        accessorKey: 'nrs_region',
        header: 'NRS Region',
        filterVariant: 'select',
        filterSelectOptions: nrsRegionFilter
      },
      {
        accessorKey: 'responsible_epd',
        header: 'Responsible EPD',
        filterVariant: 'select',
        filterSelectOptions: epdFilter
      },
      {
        accessorKey: 'cairt_lead',
        header: 'FN CAIRT Lead',
        filterVariant: 'select',
        filterSelectOptions: cairtLeadFilter
      },
      {
        accessorKey: 'eao_team',
        header: 'Lead\'s Team',
        filterVariant: 'select',
        filterSelectOptions: teamFilter
      },
      {
        accessorKey: 'work_lead',
        header: 'Work Lead',
        filterVariant: 'select',
        filterSelectOptions: workLeadFilter
      },
      {
        accessorKey: 'work_team_members',
        header: 'Work Team Members'
      },
      ...setMonthColumns(),
      {
        accessorKey: 'referral_timing',
        header: 'Referral Timing',
        enableHiding: true
      }
    ], [setMonthColumns,
      cairtLeadFilter,
      eaActFilter,
      eaTypeFilter,
      envRegionFilter,
      epdFilter,
      iaacFilter,
      nrsRegionFilter,
      projectFilter,
      projectPhaseFilter,
      teamFilter,
      typeFilter,
      workLeadFilter]
  );
  const fetchReportData = React.useCallback(async () => {
    setResultStatus(RESULT_STATUS.LOADING);
    try {
      const reportData =
        await ReportService.fetchReportData(REPORT_TYPE.RESOURCE_FORECAST, {
          report_date: reportDate
        });
      setResultStatus(RESULT_STATUS.LOADED);
      if (reportData.status === 200) {
        setRFData((reportData.data as never)['data']);
      }
      if (reportData.status === 204) {
        setResultStatus(RESULT_STATUS.NO_RECORD);
      }
    } catch (error) {
      setResultStatus(RESULT_STATUS.ERROR);
    }
  }, [reportDate]);
  const downloadPDFReport = React.useCallback(async () => {
    try {
      fetchReportData();
      const binaryReponse =
        await ReportService.downloadPDF(REPORT_TYPE.RESOURCE_FORECAST, {
          report_date: reportDate,
          filters
        });
      const url = window.URL.createObjectURL(new Blob([(binaryReponse as any).data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download',
        `${FILENAME_PREFIX}-${dateUtils.formatDate(reportDate ? reportDate :
          new Date().toISOString())}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      setResultStatus(RESULT_STATUS.ERROR);
    }
  }, [reportDate, filters, fetchReportData]);
  return (
    <>
      <Grid component="form" onSubmit={(e) => e.preventDefault()}
        container spacing={2} sx={{ mt: '5px', mb: '15px' }}>
        <Grid item sm={2}><FormLabel>Report Date</FormLabel></Grid>
        <Grid item sm={2}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker format={DATE_FORMAT}
              onChange={(dateVal: any) => setReportDate(dateUtils.formatDate(dateVal.$d))}
              slotProps={{
                textField: {
                  id: 'ReportDate'
                }
              }} />
          </LocalizationProvider>
        </Grid>
        <Grid item sm={resultStatus === RESULT_STATUS.LOADED ? 7 : 8}>
          <Button variant='contained'
            type='submit'
            onClick={fetchReportData}
            sx={{ float: 'right' }}>Submit
          </Button>
        </Grid>
        <Grid item sm={1}>
          {resultStatus === RESULT_STATUS.LOADED &&
            <Button variant='contained' onClick={downloadPDFReport}>Download</Button>}
        </Grid>
      </Grid>
      {resultStatus !== RESULT_STATUS.ERROR && <MaterialReactTable
        initialState={{
          density: 'compact'
        }}
        columns={columns}
        enableDensityToggle={false}
        enableStickyHeader={true}
        state={
          {
            columnFilters,
            columnVisibility,
            globalFilter,
            isLoading: resultStatus === RESULT_STATUS.LOADING,
            showGlobalFilter: true
          }
        }
        positionGlobalFilter='left' 
        muiSearchTextFieldProps={{
          placeholder: 'Search',
          sx: { minWidth: '300px' },
          variant: 'outlined',
        }}
        onColumnFiltersChange={setColumnFilters}
        onColumnVisibilityChange={setColumnVisibility}
        onGlobalFilterChange={setGlobalFilter}
        renderToolbarInternalActions={({ table }) => (
          <>
            <MRT_ToggleFiltersButton table={table} />
            <MRT_ShowHideColumnsButton table={table} />
            {/* add your own custom print button or something */}
            <Tooltip title='Clear all filters'>
              <IconButton onClick={() => {
                setColumnFilters([]);
                setColumnVisibility({});
                setGlobalFilter(undefined);
              }}>
                <ClearAllIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title='Export to csv'>
              <IconButton onClick={() =>exportToCsv(table)}>
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
            <MRT_FullScreenToggleButton table={table} />
          </>
        )}
        data={rfData} />}
      {resultStatus === RESULT_STATUS.ERROR &&
        <Container>
          <Alert severity="error">
            Error occured during processing. Please try again after some time.
          </Alert>
        </Container>}
    </>
  );
}
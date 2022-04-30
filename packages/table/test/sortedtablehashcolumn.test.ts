import { runTableTestsWith } from '@rimbu/table/test-utils/table-standard-test';
import { SortedTableHashColumn } from '@rimbu/table';

runTableTestsWith(
  'SortedTableHashColumn default',
  SortedTableHashColumn.defaultContext<number, number>()
);

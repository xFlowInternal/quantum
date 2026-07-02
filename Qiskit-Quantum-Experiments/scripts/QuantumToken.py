from qiskit_ibm_runtime import QiskitRuntimeService 
import qiskit;
import qiskit_ibm_runtime

QiskitRuntimeService.save_account(
        token="bLR3F41SyJA5tM7KG1TpR97JQijm7PlcvpaNEyL3RJDl",          # get this from https://quantum.ibm.com/account
        channel="ibm_cloud",
        overwrite=True)
print(qiskit.__version__)
print(qiskit_ibm_runtime.__version__)